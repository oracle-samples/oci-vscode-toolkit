/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */


 import * as vscode from 'vscode';
 import { DocumentationItem } from '../../commands/resources';
 import { RootNode } from './rootNode';
 import { getResourcePath } from '../../utils/path-utils';
 import path = require('path');
 
 export class DocumentationNode extends RootNode {
     constructor() {
         super(
             'ormStaticDocumentNode',
             DocumentationItem.label,
             vscode.TreeItemCollapsibleState.None,
             getResourcePath(path.join('light', 'link-external-light.svg')),
             getResourcePath(path.join('dark', 'link-external-dark.svg')),
             DocumentationItem.commandName,
             [],
             DocumentationItem.context,
             [],
         );
     }

 }
