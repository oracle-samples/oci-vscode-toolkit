/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import { IRootNode } from '../../../oci-api';

export class BaseNode implements IRootNode {
    private _parent: IRootNode | undefined;
    constructor(
        public id: string,
        public label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly lightIcon: string,
        public readonly darkIcon: string,
        public readonly commandName: string,
        public readonly commandArgs: any[],
        public readonly context: string,
        public readonly childrenNodes: IRootNode[] = [],
        public parent: IRootNode | undefined = undefined,
        public description: string | undefined = '',
        public readonly tooltip: string | undefined = '',
    ) {
        this._parent = parent;
    }

    // Update the label in the node
    updateLabel(newLabel: string): void {
        this.label = newLabel;
    }

    updateDescription(newDescription: string): void {
        this.description = newDescription;
    }

    getParentNode(): IRootNode | undefined {
        return this._parent;
    }

    updateParentNode(n: IRootNode): void {
        this._parent = n;
    }

    getChildren(_element: any): Thenable<IRootNode[]> {
        return Promise.all(this.childrenNodes);
    }
}
