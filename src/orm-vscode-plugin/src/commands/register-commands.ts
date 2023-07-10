/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { createFullCommandName, FocusRMSPlugin, SignInItem, SwitchRegion } from './resources';
import { ext } from '../extensionVars';
import { IOCIProfileTreeDataProvider, IRootNode, OCIFileExplorerNode } from '../oci-api';
import { logger } from '../utils/get-logger';
import { updateStackDetails } from '../stack-manager/upload-stack';
import { getTFfileNodesByConfigType } from '../stack-manager/download-stack';
import { getStack } from '../api/orm-client';
import { OCICompartmentNode } from '../tree/nodes/oci-compartment-node';
import { applyStack, displayLogsAndUpdateStatus, planStack } from '../stack-manager/plan-apply-stack';
import { CompartmentsNode } from '../tree/nodes/oci-compartments-node';
import { isPayloadValid } from '../validations/payload-validator';
import { launchWorkFlow, revealTreeNode } from '../common/launch-workflow';
import { OCIStackNode } from '../tree/nodes/oci-stack-node';
import { getResourceManagerArtifactHook } from "../common/fileSystem/local-terraform-config";
import * as nls from 'vscode-nls';
import { getDirectoryName } from 'oci-ide-plugin-base/dist/common/fileSystem/filesystem';
import { METRIC_INVOCATION, METRIC_SUCCESS, METRIC_FAILURE } from 'oci-ide-plugin-base/dist/monitoring/monitoring';
import { Service } from 'oci-ide-plugin-base/dist/monitoring/service';
import { MONITOR } from '../common/monitor';
import { listRecentCommands } from 'oci-ide-plugin-base/dist/extension/ui/features/command-manager';
import { executeUserCommand, _appendCommandInfo } from './list-recent-commands';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

 export function registerNavigationCommands(context: vscode.ExtensionContext) {

 context.subscriptions.push(
     vscode.commands.registerCommand(createFullCommandName('openIssueInGithub'), () => {
         _appendCommandInfo(createFullCommandName('openIssueInGithub'), undefined);
         vscode.env.openExternal(vscode.Uri.parse("https://github.com/oracle-samples/oci-vscode-toolkit/issues"));
     }),
 );
 vscode.commands.executeCommand('setContext', 'enableRMSViewTitleMenus', true);
}

 export function registerItemContextCommands(context: vscode.ExtensionContext) {
 context.subscriptions.push(
     vscode.commands.registerCommand(createFullCommandName('updateStack'), async (node: OCIStackNode) => {
        _appendCommandInfo(createFullCommandName('updateStack'), node);
         await updateStackDetails(node);
     }),
 );

 context.subscriptions.push(
    vscode.commands.registerCommand(createFullCommandName('planStack'), async (node: OCIStackNode) => {
        _appendCommandInfo(createFullCommandName('planStack'), node);
        const jobResponse = await planStack(node);
        await displayLogsAndUpdateStatus(node, jobResponse);
    }),
);

context.subscriptions.push(
    vscode.commands.registerCommand(createFullCommandName('applyStack'), async (node: OCIStackNode) => {
        _appendCommandInfo(createFullCommandName('applyStack'), node);
        const jobResponse = await applyStack(node);
        await displayLogsAndUpdateStatus(node, jobResponse);
    }),
);

context.subscriptions.push(
    vscode.commands.registerCommand(
        createFullCommandName('createFile'),        
        async (node : OCIFileExplorerNode) => {
            _appendCommandInfo(createFullCommandName('createFile'), node);
            const fileName = await promptForFileOrDirName();
            getResourceManagerArtifactHook().createTextFile(path.join(node.uriPath.fsPath, fileName!), '');
            ext.treeDataProvider.refresh(node);
        }),
);

context.subscriptions.push(
    vscode.commands.registerCommand(
        createFullCommandName('createDirectory'),
        async (node : OCIFileExplorerNode) => {
            _appendCommandInfo(createFullCommandName('createDirectory'), node);
            const fileName = await promptForFileOrDirName();
            getResourceManagerArtifactHook().ensureDirectoryExists(path.join(node.uriPath.fsPath, fileName!));
            ext.treeDataProvider.refresh(node);
        }),
);

context.subscriptions.push(
    vscode.commands.registerCommand(
        createFullCommandName('deletefileOrDir'),
        async (node: OCIFileExplorerNode) => {     
            _appendCommandInfo(createFullCommandName('deletefileOrDir'), undefined);           
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'deletefileOrDir', undefined, node.uriPath.fsPath));
            fs.lstat(node.uriPath.fsPath, () => {                  
            try {
                getResourceManagerArtifactHook().remove( node.uriPath.fsPath );
                ext.treeDataProvider.refresh(undefined);                    
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'deletefileOrDir', undefined, node.uriPath.fsPath));
            } catch (error) {
                let errorMsg = localize('deleteFileOrDirErrorMsg','Unable to delete the deirectory or file at : ');
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'deletefileOrDir', undefined, node.uriPath.fsPath, errorMsg+ ': ' +JSON.stringify(error)));
                logger().error(errorMsg, node.uriPath.fsPath, error);
                throw error;
            }
        });
    }),
);

context.subscriptions.push(
    vscode.commands.registerCommand(
        createFullCommandName('openInTerminal'), async (node: OCIFileExplorerNode) => {
            _appendCommandInfo(createFullCommandName('openInTerminal'), node);
            const dirName = getDirectoryName(node.uriPath.fsPath);
            vscode.window.createTerminal({
                cwd: dirName,
            }).show();
        }),
);

 context.subscriptions.push(
    vscode.commands.registerCommand(createFullCommandName('updatePlanStack'), async (node: OCIStackNode) => {     
       try {
            _appendCommandInfo(createFullCommandName('applyStack'), node);
            await updateStackDetails(node.resource);
            const jobResponse = await planStack(node);
            await displayLogsAndUpdateStatus(node, jobResponse);            
       } catch (error) {
            let errorMsg = localize('updatePlanStackErrorMsg','Error in updating and planning stack: ');
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'updatePlanStack', undefined, node.id, errorMsg+ ': ' +JSON.stringify(error)));
            logger().error(errorMsg, node.id, error);
            throw error;
       }
    }),
);

 context.subscriptions.push(
     vscode.commands.registerCommand(createFullCommandName('updateApplyStack'), async (node: OCIStackNode) => {
        try {
            _appendCommandInfo(createFullCommandName('updateApplyStack'), node);
            await updateStackDetails(node);
            const jobResponse = await applyStack(node);
            await displayLogsAndUpdateStatus(node, jobResponse);
       } catch (error) {
            let errorMsg = localize('updateApplyStackErrorMsg','Error in updating and applying stack: ');
            logger().error(errorMsg, node.id, error);
            throw error;
       }
     }),
 );
 }

 export function registerGenericCommands(context: vscode.ExtensionContext){
    context.subscriptions.push(
        vscode.commands.registerCommand(createFullCommandName("launch"), async function(payload: any){
            _appendCommandInfo(createFullCommandName('launch'), payload);                       
            _appendCommandInfo(FocusRMSPlugin.commandName, undefined);
            await vscode.commands.executeCommand(FocusRMSPlugin.commandName);
            if(isPayloadValid(payload)){
                await vscode.commands.executeCommand(SwitchRegion.commandName, payload.region_name);
                _appendCommandInfo(SwitchRegion.commandName, payload.region_name);
                await launchWorkFlow(payload);
            }
            else{
                const msg = localize('launchErrorMsg', 'Payload is not valid. Please check the payload {0}', payload);
                vscode.window.showErrorMessage(msg, { modal: true });
            }
            
        })
     );

     context.subscriptions.push(
        vscode.commands.registerCommand('rms.listRecentActions', async (node: any) => {                
                const selectedCommand = await listRecentCommands(node);
                executeUserCommand(selectedCommand);
            }
        )
    );

 context.subscriptions.push(
     vscode.commands.registerCommand(createFullCommandName('filterCompartment'), async () => {
        _appendCommandInfo(createFullCommandName('filterCompartment'), undefined);
        let options: vscode.InputBoxOptions = {
            prompt: localize('filterCompartmentInputMsg', 'Please enter compartment ocid '),
            placeHolder: localize('filterCompartmentPlaceholderMsg', '(placeholder)')
        };
        let compartmentId: string | undefined = await vscode.window.showInputBox(options);
        if(compartmentId){
           const compartment = await ext.api.getCompartmentById(compartmentId);
           
           let profileNode : IRootNode = await ext.treeDataProvider.findTreeItem(ext.api.getCurrentProfile().getProfileName()).then(function(data) {return data!;});
           await revealTreeNode(profileNode);
          
           const staticCompartmentsNode = new CompartmentsNode();
           await revealTreeNode(staticCompartmentsNode);
  
           const compartmentNode = new OCICompartmentNode(compartment?.compartment, ext.api.getCurrentProfile().getProfileName(), undefined, []);
           await revealTreeNode(compartmentNode);
        }
        else{
           const msg = localize('filterCompartmentErrorMsg', 'CompartmentId {0} is not valid. Please check the CompartmentId and try again', compartmentId);
           vscode.window.showErrorMessage(msg, { modal: true });
        }
     }),
 );

 context.subscriptions.push(
     vscode.commands.registerCommand(createFullCommandName('downloadStack'), async (stack: OCIStackNode) => {
        _appendCommandInfo(createFullCommandName('downloadStack'), stack);
         if(getResourceManagerArtifactHook().pathExists(stack.id!)){
             let downloadStackInfoMsg = localize("downloadStackInfoMsg","Directory already exists and this will overwrite the contents. Do you wish to continue?");
             let yesAction = localize("yesButtonLabel","Yes");
             let noAction = localize("noButtonLabel","No");
             await vscode.window.showInformationMessage(downloadStackInfoMsg, yesAction, noAction)
             .then(async answer => {
                 if (answer === yesAction) {
                     getResourceManagerArtifactHook().remove(stack.id!);
                     const getStackResponse = await getStack(stack.id!);
                     const configSource = getStackResponse.stack.configSource?.configSourceType;
                     await getTFfileNodesByConfigType(configSource, ext.api.getCurrentProfile().getProfileName(), getStackResponse);
                     _appendCommandInfo(createFullCommandName('refreshTree'), stack);
                     await vscode.commands.executeCommand(createFullCommandName("refreshTree"), stack);
                 }
             });   
        }
        await ext.treeView.reveal(stack, { focus: true, expand: true });
     })
 );

 context.subscriptions.push(
     vscode.commands.registerCommand(createFullCommandName('documentationNode'), async () => {
        _appendCommandInfo(createFullCommandName('documentationNode'), undefined);
         await vscode.env.openExternal(
             vscode.Uri.parse(
                 'https://docs.oracle.com/en-us/iaas/Content/ResourceManager/Tasks/managingstacksandjobs.htm',
             ),
         );
     })
  );
 }

 export function registerCommands(
     context: vscode.ExtensionContext,
     dataProvider: IOCIProfileTreeDataProvider,
 ): void {

     ext.api.onSignInCompleted(() => dataProvider.refresh(undefined));

     context.subscriptions.push(
         vscode.commands.registerCommand(SignInItem.commandName, async () => {
            
            _appendCommandInfo(SignInItem.commandName, undefined);
             const profileName = await vscode.window.withProgress<string | undefined>(
                 {
                     location: vscode.ProgressLocation.Notification,
                     cancellable: true,
                 },
                 async (progress: any, token: any) => {
                     progress.report({ message: localize('signingInMsg', 'Signing in...')});
                     return ext.api.signIn(undefined, undefined, token);
                 },
             );
             if (profileName) {
                 dataProvider.refresh(undefined);
             }
         }),
     );
 }

 export async function promptForFileOrDirName(
    ): Promise<string | undefined> {
        // Get the file or folder name
        const fileName: vscode.InputBoxOptions = {
            prompt: '',
            ignoreFocusOut: true,
        };
        return vscode.window.showInputBox(fileName);
    }
