/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';

import { IOCIResource } from "../../oci-api";
import { OCINode } from "./ociNode";
import { OCIJobNodeItem, RunJob } from '../commands/resources';
import { OCIJobRunNode } from './oci-job-run-node';
import { ext } from '../../extensionVars';
import * as dataScience from "../../api/oci/data-science";
import { RootNode } from './rootNode';
import * as nodeBuilder from "./builders/node-builder";
import { getResourcePath, logger } from "../vscode_ext";
import * as dataScienceArtifacts from "../../api/oci/data-science-artifacts";
import * as localArtifact from "../../api/oci/local-artifact";
import { loadTemplatedStringFromTextFile } from "oci-ide-plugin-base/dist/common/fileSystem/filesystem";
import { downloadJobArtifact } from "../../api/oci/data-science-artifacts";
import * as nls from 'vscode-nls';
import { METRIC_FAILURE, METRIC_INVOCATION, METRIC_SUCCESS } from 'oci-ide-plugin-base/dist/monitoring/monitoring';
import { Service } from 'oci-ide-plugin-base/dist/monitoring/service';
import { MONITOR } from '../../common/monitor';
import { _appendCommandInfo } from '../commands/list-recent-commands';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export class OCIJobNode extends OCINode {
    constructor(job: IOCIResource) {
        super(
            job,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/jobs-light.svg'),
            getResourcePath('dark/jobs-dark.svg'),
            OCIJobNodeItem.commandName,
            OCIJobNodeItem.context,
            [],
        );
    }

    async getChildren(_element: any): Promise<RootNode[]> {
        const runNodes = await nodeBuilder.makeSubnodes(
            () => dataScience.listJobRuns(this.resource.compartmentId!, this.resource.id!),
            OCIJobRunNode,
        );

        return [await this.createArtifactNode()].concat(runNodes);
    }

    async createArtifactNode(): Promise<RootNode> {
        const jobId = this.resource.id!;
        const artifactStorage = localArtifact.artifactsSandboxFolder();
        const artifactFolderPath = artifactStorage.pathExists(jobId) ?
            artifactStorage.fullPath(jobId) : await downloadJobArtifact(jobId);

        const staticArtifactNodeLabel = localize('staticArtifactNodeLabel','Artifact');
        const artifactNode = ext.api.createDirectoryNode(artifactFolderPath, false, true, staticArtifactNodeLabel);
        customizeArtifactNode();
        return artifactNode;

        function customizeArtifactNode() {
            const iconPrefix = 'each-artifact';
            artifactNode.lightIcon = getResourcePath(`light/${iconPrefix}-light.svg`);
            artifactNode.darkIcon = getResourcePath(`dark/${iconPrefix}-dark.svg`);
        }
    }

    public static get contextItemCommands(): { dispose(): any }[] {
        return [
            vscode.commands.registerCommand(RunJob.commandName, async (node: OCIJobNode) => await checkNodeTypeAndCompareArtifact(node))
        ];

        async function checkNodeTypeAndCompareArtifact(node: OCIJobNode): Promise<any> {
            return await localArtifact.compareLocalJobArtifactWithArtifactFromService(node.id!) === "Modified" ? showUserOptionsForModifiedJobArtifact(node) : runJob(node);
        }

        function showUserOptionsForModifiedJobArtifact(node: OCIJobNode) {
            const message = localize('jobArtifactMsg', 'The job artifact has been edited. To run a job on the edited artifact, a new job must be created by clicking on Create new job. To run the job with the original code, click on Continue.');
            const createNewJob = localize('createNewJobOption', 'Create new job');
            const continueJobRun = localize('continueJobRunOption', 'Continue');
            vscode.window.showInformationMessage(message, createNewJob, continueJobRun).then(answer => {
                if (answer === createNewJob) {
                    const rootFolder = localArtifact.artifactsSandboxFolder().root;
                    OCIJobNode.createNewJobFromArtifact(`${rootFolder}/${node.id}`);
                } else if (answer === continueJobRun) {
                    runJob(node);
                }
            });
        }

        function runJob(node: OCIJobNode) {
            try {
                _appendCommandInfo(RunJob.commandName, node);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'launchWorkFlow', undefined, node.id));          
                const panel = OCIJobNode.createWebPanel(node);

                panel.onDidReceiveMessage(message => {
                    if (message.command === 'runJob') {
                        const jobConfigurationOverrideDetails = {
                            jobType: 'DEFAULT',
                            environmentVariables: message.environmentVariables,
                            commandLineArguments: message.commandLineArguments,
                            maximumRuntimeInMinutes: parseInt(message.maxRuntime),
                        };

                        dataScience.runJob(node.resource, jobConfigurationOverrideDetails).then(
                            async (jobRun) => {
                                const infoMsg = localize('runJobInfoMsg', 'Job Run started: {0} ...', jobRun.displayName);
                                await vscode.window.showInformationMessage(infoMsg, { modal: false });
                                ext.treeDataProvider.refresh(node);                                
                                return;
                            }
                        );
                    }
                });
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'launchWorkFlow', undefined, node.id));          
            } catch (error) {
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'launchWorkFlow', undefined, node.id, JSON.stringify(error)));          
                const errorMsg = localize('runJobErrorMsg', 'Failed to start a job run: ');
                logger().error(errorMsg, error);
                throw error;
            }
        }
    }

    public static async createNewJobFromArtifact(artifactId: string) {      
        const createdJobId = await dataScienceArtifacts.createNewJobFromArtifact(artifactId!);
        ext.treeDataProvider.refresh(undefined);
        const msg = localize('createNewJobInfoMsg', 'New job with the job id : {0} has been created from the existing artifact', createdJobId);
        logger().info(msg);
        await vscode.window.showInformationMessage(msg);
    }

    private static createWebPanel(node: OCIJobNode) {
        const title = localize('startAJobRun', 'Start a job run');
        const webView = ext.api.getWebView(ext.context.extensionUri, title, `${title}: ${node.label}`);
        webView.loadView(loadTemplatedStringFromTextFile(getResourcePath('html/run-job.html'), getTemplateReplacementStrings()),
            ['run-job.js'], ['common.css']);
        return webView.getWebViewPanel();

        function getTemplateReplacementStrings() :{}{
            return {
                title: localize('startAJobRun.title', 'Run job'),
                heading: localize('startAJobRun.heading', 'Job Name: {0}', node.label),
                key: localize('startAJobRun.key', 'Key'),
                value: localize('startAJobRun.value', 'Value'),
                addEnvVariable: localize('startAJobRun.addEnvVariable', 'Add Environment Variable'),
                commandLineArguments: localize('startAJobRun.commandLineArguments', 'Command line arguments'),
                maxRuntime: localize('startAJobRun.maxRuntime', 'Max runtime (in minutes)'),
                run: localize('startAJobRun.run', 'Run')
            };
        }
    }
}
