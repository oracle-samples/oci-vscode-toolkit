/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as nls                                                 from 'vscode-nls';
nls.config({ messageFormat: nls.MessageFormat.bundle,bundleFormat:nls.BundleFormat.standalone})();
import * as vscode                                              from 'vscode';
import {
    registerCommands,
    registerGenericCommands,
    registerItemContextCommands,
    registerMenuActionLinks,
    registerNavigationCommands
}                                                               from './ui/commands/register-commands';
import { RefreshTree }                                          from './ui/commands/resources';
import { treeNodeCommands }                                     from './ui/commands/resources';
import * as clients                                             from './api/oci/clients';
import { ext }                                                  from './extensionVars';
import { IOCIProfile, IOCIProfileTreeDataProvider }             from './oci-api';
import { DocumentationNode }                                    from './ui/treeNodes/documentation-node';
import { CompartmentsNode }                                     from './ui/treeNodes/oci-compartments-node';
import { Service } from 'oci-ide-plugin-base/dist/monitoring/service';
import { METRIC_FAILURE, METRIC_SUCCESS } from 'oci-ide-plugin-base/dist/monitoring/monitoring';
import { MONITOR } from './common/monitor';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function activate(context: vscode.ExtensionContext) {
    
    // extension name = publisher.extensionId
    try {
        const compartmentsExtension = vscode.extensions.getExtension(
            'Oracle.oci-core',
        );
        if (!compartmentsExtension) {
            const ociCoreNotLoadedErrorMsg = localize('ociCoreNotLoadedErrorMsg','Failed to load the Compartments extension.');
            throw new Error(ociCoreNotLoadedErrorMsg);
        }
        ext.api = compartmentsExtension.exports;    
        MONITOR.setTenancyOCID(ext.api.getCurrentProfile().getTenancy());    
        ext.context = context;        
    
        ext.api.onAccountCreated(async () => {
            await setupTreeView();
        });
    
        if (ext.api.accountExists()) {
            await registerItemContextCommands(ext.context);
            await registerNavigationCommands(ext.context);
            await registerMenuActionLinks(ext.context);
            await registerGenericCommands(ext.context);
            await setupTreeView();
        }
        
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'odsc-activate', undefined));    
    } catch (error) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'odsc-activate', undefined, undefined, JSON.stringify(error)));        
    }      
}

function refresh() {
    ext.treeDataProvider.refresh(undefined);
}

async function setupTreeView() {
    const treeDataProvider = await registerTreeView();
     ext.api.onProfileChanged(async (profile: IOCIProfile) => {
        clients.setProfileName(profile.getProfileName());
        await ext.treeDataProvider.switchProfile(profile);
        refresh();
     });
     registerCommands(ext.context, treeDataProvider);
     ext.treeDataProvider = treeDataProvider;
     ext.treeView.onDidExpandElement((element) => {
        ext.treeView.reveal(element.element, { focus: true, select: true, expand: 1 });
    });
    refresh();
}

async function registerTreeView(): Promise<IOCIProfileTreeDataProvider> {

    const docNodeCreator = () =>
        Promise.resolve([new DocumentationNode()]);
    const compartmentsNodeCreator = () =>
        Promise.resolve([new CompartmentsNode()]);

    const treeProvider = ext.api.createProfileTreeProvider(
        docNodeCreator,
        compartmentsNodeCreator,
    );

    ext.treeDataProvider = treeProvider;

    ext.treeView = vscode.window.createTreeView("odsc", {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
    });

    ext.context.subscriptions.push(ext.treeView);
    vscode.commands.registerCommand(
        RefreshTree.commandName, (node: any) =>
            treeProvider.refresh(node),
    );
    await registerTreeNodeCommands(ext.context, treeNodeCommands);

    vscode.workspace.onDidChangeWorkspaceFolders(refresh);

    vscode.workspace.onDidChangeConfiguration((e: any) => {
        if (e.affectsConfiguration('odsc')) {
            refresh();
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

export function deactivate() {
    MONITOR.flush();
}

