/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

 import * as vscode from 'vscode';
 import { IRootNode } from '../../oci-api';
 
 // Represents a root node in the tree view
 export class RootNode implements IRootNode {
     constructor(
         public id: string,
         public label: string,
         public readonly collapsibleState: vscode.TreeItemCollapsibleState,
         public readonly lightIcon: string,
         public readonly darkIcon: string,
         public readonly commandName: string,
         public readonly commandArgs: any[],
         public context: string,
         public readonly childrenNodes: IRootNode[] = [],
         public parent: IRootNode | undefined = undefined,
         public description: string | undefined = '',
         public readonly tooltip: string | undefined = '',
     ) {
         this.parent = parent;
     }
 
     // Update the label in the node
     updateLabel(newLabel: string): void {
         this.label = newLabel;
     }
 
     updateDescription(newDescription: string): void {
         this.description = newDescription;
     }
 
     getParentNode(): IRootNode | undefined {
         return this.parent;
     }
 
     updateParentNode(n: IRootNode): void {
         this.parent = n;
     }
 
     getChildren(element: any): Thenable<IRootNode[]> {
         return Promise.all(this.childrenNodes);
     }
 }
