/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { appendCommandInfo, findIDEAction, IDEAction } from 'oci-ide-plugin-base/dist/extension/ui/features/command-manager';
import { ext } from '../../../extensionVars';
import { logger } from '../../../utils/get-logger';
import { RootNode } from '../../tree/nodes/rootNode';
import * as vscode from 'vscode';

export function _appendCommandInfo(commandName: string, node: any) {
    try {
        if (node !== undefined && node instanceof RootNode) {
            appendCommandInfo(commandName, node, node.label);
        } else {
            appendCommandInfo(commandName, node);
        }
    } catch (error) {
        logger().error('Error while appending executed command to recent list.' + JSON.stringify(error));
    }
}

export function executeUserCommand(userCmdListItem: string) {
    const action: IDEAction | undefined = findIDEAction(userCmdListItem);
    if (action !== undefined) {
        const treeItem = action.getData();
        if (treeItem instanceof RootNode) {
            ext.treeView.reveal(treeItem, { focus: true, select: true, expand: 1 });
        }
        vscode.commands.executeCommand(action.getCommand(), action.getData());
    }
}
