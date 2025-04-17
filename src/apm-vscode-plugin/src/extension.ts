/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
import * as vscode from 'vscode';
import { registerCommands, registerGenericCommands, registerItemContextCommands } from './ui/commands/register-commands';
import { RefreshTree, treeNodeCommands } from './ui/commands/resources';
import { ext } from './extensionVars';
import { IOCIProfileTreeDataProvider, IOCIProfile, LOG } from './oci-api';
import { DcoumentationNode } from '../src/ui/tree/nodes/documentation-node';
import { getAPMRootFolder, getArtifactHook } from './common/fileSystem/local-artifact';
import { MONITOR } from './common/monitor';
import { createCompartmentNodes } from './ui/tree/nodes/oci-compartment-node';

let logger: LOG;
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function activate(context: vscode.ExtensionContext) {

    // extension name = publisher.extensionId
    const compartmentsExtension = vscode.extensions.getExtension(
        'Oracle.oci-core',
    );
    vscode.commands.executeCommand('setContext', 'enableApmSyntheticsViewTitleMenus', false);
    if (!compartmentsExtension) {
        throw new Error(localize('ociCoreNotLoadedErrorMsg', 'Failed to load the Compartments extension.'));
    }

    const ociAccountExtensionApi = compartmentsExtension.exports;
    ext.api = ociAccountExtensionApi;

    MONITOR.setTenancyOCID(ext.api.getCurrentProfile().getTenancy());
    ext.context = context;

    logger = ext.api.getLogger("oci-vscode-toolkit");
    getArtifactHook().ensureDirectoryExists(getAPMRootFolder());

    const outputChannel = vscode.window.createOutputChannel('APM Extension');
    ext.api.onAccountCreated(async () => {
        await setupTreeView(outputChannel);
    });
    if (ext.api.accountExists()) {
        await setupTreeView(outputChannel);
        await registerItemContextCommands(ext.context, ext.treeDataProvider);
        await registerGenericCommands(ext.context, outputChannel);
    }
    vscode.window.showInformationMessage(localize("welcomeMsg", "Welcome to OCI Application Performance Monitoring Extension."));
}

async function setupTreeView(outputChannel: vscode.OutputChannel) {
    const treeDataProvider = await registerTreeView(outputChannel);
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

async function registerTreeView(outputChannel: vscode.OutputChannel): Promise<IOCIProfileTreeDataProvider> {

    const docNodeCreator = () =>
        Promise.resolve([new DcoumentationNode()]);
    const compartmentsNodeCreator = () =>
        Promise.resolve(createCompartmentNodes(outputChannel));

    const treeProvider = ext.api.createProfileTreeProvider(
        docNodeCreator,
        compartmentsNodeCreator,
    );

    ext.treeDataProvider = treeProvider;

    ext.treeView = vscode.window.createTreeView("apm", {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
    });

    ext.context.subscriptions.push(ext.treeView);

    vscode.commands.registerCommand(
        RefreshTree.commandName, (node: any) =>
        treeProvider.refresh(node),
    );

    await registerTreeNodeCommands(ext.context, treeNodeCommands);

    // Refresh the tree view whenever workspace folders change
    vscode.workspace.onDidChangeWorkspaceFolders(() =>
        treeProvider.refresh(undefined),
    );

    vscode.workspace.onDidChangeConfiguration((e: any) => {
        if (e.affectsConfiguration('apm')) {
            treeProvider.refresh(undefined);
        }
    });

    return treeProvider;
}

async function registerTreeNodeCommands(context: vscode.ExtensionContext, commandNames: string[]) {
    commandNames.length > 0 && commandNames.forEach((commandName) => {
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
