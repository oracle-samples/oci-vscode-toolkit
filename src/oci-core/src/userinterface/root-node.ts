/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { TreeItemCollapsibleState } from "vscode";

export interface IRootNode {
    updateLabel(newLabel: string): void;
    updateDescription(newDescription: string): void;
    updateParentNode(n: IRootNode): void;
    getParentNode(): IRootNode | undefined;
    getChildren(element: any): Thenable<IRootNode[]>;

    id: string;
    label: string;
    commandName: string;
    commandArgs: any[];
    collapsibleState: TreeItemCollapsibleState;
    lightIcon: string | undefined;
    darkIcon: string | undefined;
    context: string;
    childrenNodes: IRootNode[];
    parent: IRootNode | undefined;
    description: string | undefined;
    tooltip: string | undefined;
}
