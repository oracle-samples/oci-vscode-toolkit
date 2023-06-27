/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as nls from 'vscode-nls';
import {
    window, workspace, TreeViewSelectionChangeEvent
} from 'vscode';
import { IOCIProfile } from '../profilemanager/profile';
import { IRootNode } from '../userinterface/root-node';
import { IOCIProfileTreeDataProvider } from '../userinterface/profile-tree-data-provider';
import { ext } from '../extension-vars';
import {
    createCompartmentNodes
} from '../userinterface/oci-compartment-node';
import { BaseNode } from '../userinterface/base-node';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function setupTreeView() {
    const treeDataProvider = await registerTreeView();
    ext.api.onProfileChanged((profile: IOCIProfile) => {
        treeDataProvider.switchProfile(profile);
        treeDataProvider.refresh(undefined);
    });

    ext.treeView.onDidExpandElement((element) => {
        if (element.element instanceof BaseNode) {
            ext.treeView.reveal(element.element, { focus: true, select: true, expand: 3 });
        }
    });
    ext.treeDataProvider.refresh(undefined);

}

async function registerTreeView(): Promise<IOCIProfileTreeDataProvider> {
    const treeProvider = ext.api.createProfileTreeProvider(
        undefined,
        createCompartmentNodes,
    );
    ext.treeDataProvider = treeProvider;
    ext.treeView = window.createTreeView('oci-core', {
        treeDataProvider: treeProvider,
        showCollapseAll: true,
    });
    ext.context.subscriptions.push(ext.treeView);

    ext.treeView.onDidChangeSelection(
        (e: TreeViewSelectionChangeEvent<IRootNode>) => {
            if (e.selection.length > 0) {
                const node = e.selection[0];
                // Don't fire the event for compartments
                if (!node.id.includes('compartment')) {
                    ext.onResourceNodeClickedEventEmitter.fire(e.selection[0]);
                }
            }
        },
    );

    // Refresh whenever configuration changes
    workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('Oracle')) {
            treeProvider.refresh(undefined);
        }
    });
    return treeProvider;
}
