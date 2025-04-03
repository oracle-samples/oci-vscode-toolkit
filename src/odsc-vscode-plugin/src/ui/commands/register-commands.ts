/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
    GetJobArtifact,
    SignInItem,
    OpenIssueInGithub,
    ListResource,
    ShowDocumentation, CreateJob,
    createFullCommandName,FocusDataSciencePlugin,SwitchRegion, ListRecentActions
}                                                           from './resources';
import { ext }                                              from '../../extensionVars';
import { IOCIProfileTreeDataProvider, IRootNode, OCIFileExplorerNode } from '../../oci-api';
import { OCICompartmentNode }                               from '../treeNodes/oci-compartment-node';
import { OCIJobRunNode }                                    from '../treeNodes/oci-job-run-node';
import { OCIJobNode }                                       from '../treeNodes/oci-job-node';
import { logger }                                           from "../vscode_ext";
import { launchWorkFlow, revealTreeNode }                   from './launch-workflow';
import { isPayloadValid }                                   from '../../validations/payload-validator';
import * as localArtifact                                   from "../../api/oci/local-artifact";
import * as nls                                             from 'vscode-nls';
import { METRIC_FAILURE, METRIC_INVOCATION, METRIC_SUCCESS } from 'oci-ide-plugin-base/dist/monitoring/monitoring';
import { getDirectoryName } from 'oci-ide-plugin-base/dist/common/fileSystem/filesystem';
import { Service } from 'oci-ide-plugin-base/dist/monitoring/service';
import { MONITOR } from '../../common/monitor';
import { listRecentCommands } from 'oci-ide-plugin-base/dist/extension/ui/features/command-manager';
import { executeUserCommand, _appendCommandInfo } from './list-recent-commands';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export function registerCommands(
    context: vscode.ExtensionContext,
    dataProvider: IOCIProfileTreeDataProvider,
): void {
    ext.api.onSignInCompleted(() => dataProvider.refresh(undefined));

    context.subscriptions.push(
        vscode.commands.registerCommand(SignInItem.commandName, async () => {
            _appendCommandInfo(SignInItem.commandName, undefined);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, SignInItem.commandName, undefined));            
            const profileName = await vscode.window.withProgress<string | undefined>(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: true,
                },
                async (progress: any, token: any) => {
                    progress.report({message: localize('signInMsg','Signing in...')});
                    return ext.api.signIn(undefined, undefined, token);
                },
            );
            if (profileName) {
                dataProvider.refresh(undefined);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, SignInItem.commandName, undefined));
            }
        }),
    );

}

export async function registerNavigationCommands(_: vscode.ExtensionContext) {
}

export async function registerItemContextCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(OpenIssueInGithub.commandName, () => {
            _appendCommandInfo(OpenIssueInGithub.commandName, undefined);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, OpenIssueInGithub.commandName, undefined));
            vscode.env.openExternal(vscode.Uri.parse("https://github.com/oracle-samples/oci-vscode-toolkit/issues"));
        }),
    );
    vscode.commands.executeCommand('setContext', 'enableDataScienceViewTitleMenus', true);
    context.subscriptions.push(...OCIJobRunNode.contextItemCommands);
    context.subscriptions.push(...OCIJobNode.contextItemCommands);
}

export async function registerMenuActionLinks(context: vscode.ExtensionContext) {
    context.subscriptions.push(        
        vscode.commands.registerCommand(CreateJob.commandName, async (node: OCIFileExplorerNode) => {
        _appendCommandInfo(CreateJob.commandName, node);
        OCIJobNode.createNewJobFromArtifact(node.id!);
        }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            createFullCommandName('createFile'),
            async (node : OCIFileExplorerNode) => {
                _appendCommandInfo(createFullCommandName('createFile'), node);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'createFile', undefined));
                const fileName = await promptForFileOrDirName();
                ext.api.createFile(path.join(node.uriPath.fsPath,fileName!));
                ext.treeDataProvider.refresh(node);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'createFile', undefined));
            }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            createFullCommandName('createDirectory'),
            async (node : OCIFileExplorerNode) => {
                _appendCommandInfo(createFullCommandName('createDirectory'), node);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'createDirectory', undefined));
                const fileName = await promptForFileOrDirName();
                ext.api.createDirectory(path.join(node.uriPath.fsPath,fileName!));
                ext.treeDataProvider.refresh(node);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'createDirectory', undefined));
            }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            createFullCommandName('deletefileOrDir'),
            async (node : OCIFileExplorerNode) => {
            _appendCommandInfo(createFullCommandName('deletefileOrDir'), node);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'deletefileOrDir', undefined));
            let isdirectory:boolean = false;
            fs.lstat(node.uriPath.fsPath, (err, stats) => {
            isdirectory=stats.isDirectory();
            if(isdirectory)
            {
                ext.api.deleteDirectory(node.uriPath.fsPath);
            }
            else
            {
                ext.api.deleteFile(node.uriPath.fsPath);}
            });
            ext.treeDataProvider.refresh(undefined);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'deletefileOrDir', undefined));
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(GetJobArtifact.commandName, async (artifactNode: OCIFileExplorerNode) => {
            _appendCommandInfo(GetJobArtifact.commandName, artifactNode);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, GetJobArtifact.commandName, undefined));
            const artifactStorage = localArtifact.artifactsSandboxFolder();
            const artifactId = artifactStorage.relativePathFromAbsolute(artifactNode.id);
            artifactStorage.remove(artifactId);
            ext.treeDataProvider.refresh(undefined);
            const msg = localize('getJobArtifactMsg', 'Re-downloaded artifact into local artifact folder.');
            logger().info(msg);
            await vscode.window.showInformationMessage(msg);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, GetJobArtifact.commandName, undefined));
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(createFullCommandName('openInTerminal'), async (node: OCIFileExplorerNode) => {
            _appendCommandInfo(createFullCommandName('openInTerminal'), node);
            const dirName = getDirectoryName(node.uriPath.fsPath);
            vscode.window.createTerminal({
                cwd: dirName,
            }).show();
        })
    );
}

export async function registerGenericCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(ListRecentActions.commandName, async (node: any) => {                
                const selectedCommand = await listRecentCommands(node);
                executeUserCommand(selectedCommand);
            }
        )
    );
    context.subscriptions.push(
        vscode.commands.registerCommand(createFullCommandName("launch"), async function (payload: any) {
            _appendCommandInfo(createFullCommandName('launch'), payload);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, createFullCommandName("launch"), undefined));            
            await vscode.commands.executeCommand(FocusDataSciencePlugin.commandName); // a short term solution fro bug in theia 1.38
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, FocusDataSciencePlugin.commandName, undefined));            
            if (isPayloadValid(payload)) {
                await vscode.commands.executeCommand(FocusDataSciencePlugin.commandName);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, SwitchRegion.commandName, undefined));            
                await vscode.commands.executeCommand(SwitchRegion.commandName, payload.region_name);
                await launchWorkFlow(payload);
            }
            else {                
                const msg = localize('launchWorkflowErrorMsg','Payload is not valid. Please check the payload {0}',payload);
                vscode.window.showErrorMessage(msg, { modal: true });
            }
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(ListResource.commandName, async () => {
            _appendCommandInfo(ListResource.commandName, undefined);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ListResource.commandName, undefined));            
            const promptMsg = localize('listResourcePromptMsg','Enter Compartment id to list the resources of: ');
            const placeHolderText = localize('placeHolderText','(placeholder)');
            let options: vscode.InputBoxOptions = {
                prompt: promptMsg,
                placeHolder: placeHolderText
            };
            let compartmentId: string | undefined = await vscode.window.showInputBox(options);
            await expandCompartment(compartmentId);
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(ShowDocumentation.commandName,
            async (_: vscode.TreeItem) => {
                _appendCommandInfo(ShowDocumentation.commandName, _);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ShowDocumentation.commandName, undefined));            
                await vscode.env.openExternal(
                    vscode.Uri.parse(
                        'https://docs.oracle.com/en-us/iaas/data-science/using/overview.htm',
                    ),
                );
            })
    );
}

export async function expandCompartment(compartmentId: string | undefined) {
    if(compartmentId){
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'expandCompartment', compartmentId));            
        const compartment = await ext.api.getCompartmentById(compartmentId);
        
        let profileNode : IRootNode = await ext.treeDataProvider.findTreeItem(ext.api.getCurrentProfile().getProfileName()).then(function(data) {return data!;});
        await revealTreeNode(profileNode);

        const compartmentNode = new OCICompartmentNode(compartment?.compartment, ext.api.getCurrentProfile().getProfileName(), undefined, []);
        await revealTreeNode(compartmentNode);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'expandCompartment', compartmentId));            
     }
     else{         
        const msg = localize('expandCompartmentErrorMsg','CompartmentId {0} is not valid. Please check the CompartmentId and try again',compartmentId);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'expandCompartment', undefined, compartmentId, 'CompartmentId {0} is not valid. Please check the CompartmentId and try again'  )); 
        vscode.window.showErrorMessage(msg, { modal: true });
     }
}

export async function promptForFileOrDirName(
    ): Promise<string | undefined> {
        const fileName: vscode.InputBoxOptions = {
            prompt: '',
            ignoreFocusOut: true,
        };
        return vscode.window.showInputBox(fileName);
    }
