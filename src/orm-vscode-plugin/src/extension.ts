/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as nls from 'vscode-nls';
 nls.config({ messageFormat: nls.MessageFormat.bundle,bundleFormat:nls.BundleFormat.standalone})();
import * as vscode from 'vscode';
import { registerCommands, registerGenericCommands, registerItemContextCommands, registerNavigationCommands } from './commands/register-commands';
import { RefreshTree, treeNodeCommands } from './commands/resources';
import { ext } from './extensionVars';
import { IOCIProfileTreeDataProvider, IOCIProfile } from './oci-api';
import { DocumentationNode } from './tree/nodes/documentation-node';
import { MONITOR } from './common/monitor';
import { Service } from 'oci-ide-plugin-base/dist/monitoring/service';
import { METRIC_FAILURE, METRIC_SUCCESS } from 'oci-ide-plugin-base/dist/monitoring/monitoring' ;
import { initializeRMSClient } from "./api/orm-client";
import { createCompartmentNodes } from './tree/nodes/oci-compartment-node';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

 export async function activate(context: vscode.ExtensionContext) {
    try {
        const compartmentsExtension = vscode.extensions.getExtension(
            'Oracle.oci-core',
        );
        vscode.commands.executeCommand('setContext', 'enableRMSViewTitleMenus', false);
        if (!compartmentsExtension) {
            throw new Error(localize('ociCoreNotLoadedErrorMsg', 'Failed to load the Compartments extension.'));
        }
        const ociAccountExtensionApi = compartmentsExtension.exports;
        ext.api = ociAccountExtensionApi;
        MONITOR.setTenancyOCID(ext.api.getCurrentProfile().getTenancy());    
        ext.context = context;

        ext.api.onAccountCreated(async () => {
            await setupTreeView();
        });
    
        if (ext.api.accountExists()) {
            await setupTreeView();
            registerItemContextCommands(ext.context);
            registerNavigationCommands(ext.context);
            registerGenericCommands(ext.context);
        }
        await initializeRMSClient(ext.api.getCurrentProfile());
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'rms-activate', undefined));
        vscode.window.showInformationMessage("Welcome to Resource Manager. To save updates to a stack, right-click the stack and choose 'Save changes'.");    
    } catch (error) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'rms-activate', undefined, undefined, JSON.stringify(error)));        
        throw error;    
    } 
 }

 async function setupTreeView() {
     const treeDataProvider = await registerTreeView();
     ext.api.onProfileChanged(async (profile: IOCIProfile) => {
        await ext.treeDataProvider.switchProfile(profile);
        ext.treeDataProvider.refresh(undefined);
    });
    
     registerCommands(ext.context, treeDataProvider);
     ext.treeDataProvider = treeDataProvider;
     ext.treeView.onDidExpandElement((element) => {               
        ext.treeView.reveal(element.element, { focus: true, select: true, expand: 1 });                
     });
    ext.treeDataProvider.refresh(undefined);
 }
 
 async function registerTreeView(): Promise<IOCIProfileTreeDataProvider> {
        
    const compartmentsNodeCreator = () =>
        Promise.resolve(createCompartmentNodes());

    const docNodeCreator = () =>
        Promise.resolve([new DocumentationNode()]);

    const treeProvider = ext.api.createProfileTreeProvider (
        docNodeCreator,
        compartmentsNodeCreator
    );

     ext.treeDataProvider = treeProvider;
 
     ext.treeView = vscode.window.createTreeView("rms", {
         treeDataProvider: treeProvider,
         showCollapseAll: true,
     });
 
     vscode.commands.registerCommand(
        RefreshTree.commandName, (node: any) =>
        treeProvider.refresh(node),
    );
    
     ext.context.subscriptions.push(ext.treeView) ;

    await registerTreeNodeCommands(ext.context, treeNodeCommands);
     // Refresh the tree view whenever workspace folders change
     vscode.workspace.onDidChangeWorkspaceFolders(() =>
         treeProvider.refresh(undefined),
     );
 
     vscode.workspace.onDidChangeConfiguration((e: any) => {
         if (e.affectsConfiguration('rms')) {
             treeProvider.refresh(undefined);
         }
     });
 
     return treeProvider;
 }

async function registerTreeNodeCommands(context: vscode.ExtensionContext, commandNames : string[]) {
    commandNames.length > 0 && commandNames.forEach( (commandName) => {
        context.subscriptions.push(
            vscode.commands.registerCommand(commandName,
                async (_: vscode.TreeItem) => {
                })
        );
    });
}

// this method is called when your extension is deactivated
export function deactivate() {
    MONITOR.flush();
}
