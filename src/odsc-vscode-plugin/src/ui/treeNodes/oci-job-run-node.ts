/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';

import { IOCIResource } from "../../oci-api";
import { OCINode } from "./ociNode";
import { createFullCommandName, OCIJobRunNodeItem } from '../commands/resources';
import { JobRunLifecycleStateProperties } from './logic/job-run-lifecycle-state-properties';
import { getResourcePath, logger } from "../vscode_ext";
import { ext } from "../../extensionVars";
import * as dataScience from "../../api/oci/data-science";
import * as nls from 'vscode-nls';
import { METRIC_FAILURE, METRIC_INVOCATION, METRIC_SUCCESS } from 'oci-ide-plugin-base/dist/monitoring/monitoring';
import { Service } from 'oci-ide-plugin-base/dist/monitoring/service';
import { MONITOR } from '../../common/monitor';
import { _appendCommandInfo } from '../commands/list-recent-commands';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export class OCIJobRunNode extends OCINode {
    constructor(jobRun: IOCIResource) {
        super(
            jobRun,
            vscode.TreeItemCollapsibleState.None,
            OCIJobRunNode.getIconPath(jobRun.lifecycleState!, 'light'),
            OCIJobRunNode.getIconPath(jobRun.lifecycleState!, 'dark'),
            OCIJobRunNodeItem.commandName,
            OCIJobRunNodeItem.context + "_" + new JobRunLifecycleStateProperties(jobRun.lifecycleState!).canCancel,
            [],
            undefined,
            undefined,
            new JobRunLifecycleStateProperties(jobRun.lifecycleState!).toolTip,
        );
    }

    public get relativeConsoleUrl(): string {
        return `data-science/job-runs/${this.resource.id!}`;
    }

    private static getIconPath(state: string, themeName: string): string {
        const iconSuffix = new JobRunLifecycleStateProperties(state).iconColor;
        return getResourcePath(`${themeName}/job-run-states/job-run-${themeName}-${iconSuffix}.svg`);
    }

    public static get contextItemCommands(): { dispose(): any }[] {
        return [
            viewJobRunInBrowser,
            deleteJobRun,
            cancelJobRun,
            showJobRunOutput,
        ].map(callback => vscode.commands.registerCommand(createFullCommandName(callback.name), callback));

        async function viewJobRunInBrowser(node: OCIJobRunNode) {
            _appendCommandInfo(createFullCommandName('viewJobRunInBrowser'), node);
            const consoleRootUrl = await ext.api.getConsoleUrl(ext.api.getCurrentProfile().getRegionName());
            const url = vscode.Uri.parse(`${consoleRootUrl}/${node.relativeConsoleUrl}`);
            await vscode.env.openExternal(url);
        }

        async function deleteJobRun(node: OCIJobRunNode) {
            _appendCommandInfo(createFullCommandName('deleteJobRun'), node);
            const deleteJobRunAction = localize('deleteJobRunLabel','Delete job run');
            const cancelAction = localize('cancelJobRunLabel','Cancel');
            const confirmationMsg = localize('deleteJobRunConfirmationMsg','Job run {0} will be deleted. This action cannot be undone.',node.label);

            await vscode.window.showInformationMessage(confirmationMsg, deleteJobRunAction, cancelAction).then(async answer => {                
                if (answer === deleteJobRunAction) {
                    await dataScience.deleteJobRun(node.id);
                    const infoMsg = localize('deleteJobRunInfoMsg','Job run {0} is deleted.',node.label);
                    await vscode.window.showInformationMessage(infoMsg);
                    ext.treeDataProvider.refresh(node.parent);
                }
            });
        }

        async function cancelJobRun(node: OCIJobRunNode) {
            try {
                _appendCommandInfo(createFullCommandName('cancelJobRun'), node);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'cancelJobRun', undefined, node.id));          
                await dataScience.cancelJobRun(node.id);
                ext.treeDataProvider.refresh(node.parent);
                ext.treeView.reveal(node);
                const msg = localize('cancelJobRunInfoMsg','Cancel initiated for job run {0}',node.resource.displayName);
                logger().info(msg);
                await vscode.window.showInformationMessage(msg);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'cancelJobRun', undefined, node.id));          
            } catch (exception) {
                const errorMsg = localize('cancelJobRunErrorMsg','Unable to cancel job run {0}: {1}',node.resource.displayName,((<Error>exception).message));
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'cancelJobRun', undefined, node.id, errorMsg));          
                logger().error(errorMsg);
                vscode.window.showWarningMessage(errorMsg, { modal: true });
            }
        }

        async function showJobRunOutput(node: OCIJobRunNode) {
            _appendCommandInfo(createFullCommandName('showJobRunOutput'), node);
            const run = await dataScience.getJobRun(node.id);
            const logLines = await dataScience.getJobRunLogs(run);
            const outputLogMsg = localize('outputLogMsg','<This run recorded no output. Possible fix: make sure the job has logging configured and enabled.>');
            const output = (logLines.length > 0) ? logLines.join('\n') : outputLogMsg;

            const outputChannelMsg = localize('outputChannelMsg','DataScience Job Run {0}',node.label);
            const outputChannel = vscode.window.createOutputChannel(outputChannelMsg);
            outputChannel.append(output);
            outputChannel.show();
        }
    }
}
