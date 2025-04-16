/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 import { appendCommandInfo, findIDEAction, IDEAction } from 'oci-ide-plugin-base/dist/extension/ui/features/command-manager';
 import * as vscode from 'vscode';
 import { ext } from '../../extensionVars';
 import { BaseNode } from '../treeNodes/base-node';
 import { RootNode } from '../treeNodes/rootNode';
 import { logger } from '../vscode_ext';

 
 export function _appendCommandInfo(commandName:string, node:any){
     try {
        if (node !== undefined && (node instanceof RootNode || node instanceof BaseNode))
        {
            appendCommandInfo(commandName, node, node.label);
        }else{
           appendCommandInfo(commandName, node);
        }     
     } catch (error) {
         logger().error('Error while appending executed command to recent list.', JSON.stringify(error));
     }
 }
 
 export function executeUserCommand(userCmdListItem: string) {    
    const action:IDEAction|undefined = findIDEAction(userCmdListItem);
    if (action){
        const treeItem  = action.getData();
        if (treeItem instanceof RootNode)
            {
                ext.treeView.reveal(treeItem, { focus: true, select: true, expand: 1 });                
            }
        vscode.commands.executeCommand(action.getCommand(), action.getData());        
    }
 }
