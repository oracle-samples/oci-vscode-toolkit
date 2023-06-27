/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import { LOG } from '../logger';
import { revealOCIView } from 'oci-ide-plugin-base/dist/utils/show-installed-extensions';

export async function gettingStarted(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.commands.registerCommand('getting-started.viewExplorer', async () => {
        revealOCIView();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('getting-started.activityLog', async () => {
        LOG.createLoggerChannel('oci-vscode-toolkit').show();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('getting-started.exploreCommands', async () => {
        await vscode.commands.executeCommand('workbench.action.showCommands');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('getting-started.toolkitDocumentation', async () => {
        await vscode.env.openExternal(vscode.Uri.parse('https://docs.oracle.com/iaas/Content/API/SDKDocs/vscode_plugins_intro.htm'));
    }));
}


