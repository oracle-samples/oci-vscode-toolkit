/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */


 import * as vscode           from 'vscode';
 import { ShowDocumentation } from '../commands/resources';
 import { RootNode }          from './rootNode';
 import { getResourcePath }    from "../vscode_ext";
 
 export class DocumentationNode extends RootNode {
     constructor() {
         super(
             'staticusernode',
             ShowDocumentation.label,
             vscode.TreeItemCollapsibleState.None,
             getResourcePath('light/link-external-light.svg'),
             getResourcePath('dark/link-external-dark.svg'),
             ShowDocumentation.commandName,
             ShowDocumentation.context,
             [],
         );
     }
 }
