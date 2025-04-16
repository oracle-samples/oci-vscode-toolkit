/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as nls from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();
import * as vscode from 'vscode';
import { registerCommands, registerItemContextCommands, registerGenericCommands } from './ui/commands/register-commands';
import { RefreshTree, treeNodeCommands } from './ui/commands/resources';
import { ext } from './extensionVars';
import { IOCIProfileTreeDataProvider, IOCIProfile, LOG } from './oci-api';
import { DcoumentationNode } from '../src/ui/tree/nodes/documentation-node';
import { getFAASRootFolder, getArtifactHook } from './common/fileSystem/local-artifact';
import { MONITOR } from './common/monitor';
import { installFunctionCLI } from './commands/install-oci-fn-cli';
import { createCompartmentNodes } from './ui/tree/nodes/oci-compartment-node';

let logger: LOG;
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function activate(context: vscode.ExtensionContext) {

    // extension name = publisher.extensionId
    const compartmentsExtension = vscode.extensions.getExtension(
        'Oracle.oci-core',
    );
    vscode.commands.executeCommand('setContext', 'enableFunctionsViewTitleMenus', false);
    if (!compartmentsExtension) {
        throw new Error(localize('ociCoreNotLoadedErrorMsg', 'Failed to load the Compartments extension.'));
    }

    const ociAccountExtensionApi = compartmentsExtension.exports;
    ext.api = ociAccountExtensionApi;

    MONITOR.setTenancyOCID(ext.api.getCurrentProfile().getTenancy());
    ext.context = context;

    logger = ext.api.getLogger("oci-vscode-toolkit");
    getArtifactHook().ensureDirectoryExists(getFAASRootFolder());

    ext.api.onAccountCreated(async () => {
        await setupTreeView();
    });
    if (ext.api.accountExists()) {

        await setupTreeView();
        await registerItemContextCommands(ext.context, ext.treeDataProvider);
        await registerGenericCommands(ext.context);
    }
    await installFunctionCLI();

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

    const docNodeCreator = () =>
        Promise.resolve([new DcoumentationNode()]);
    const compartmentsNodeCreator = () =>
        Promise.resolve(createCompartmentNodes());

    const treeProvider = ext.api.createProfileTreeProvider(
        docNodeCreator,
        compartmentsNodeCreator,
    );

    ext.treeDataProvider = treeProvider;

    ext.treeView = vscode.window.createTreeView("faas", {
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
        if (e.affectsConfiguration('faas')) {
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
