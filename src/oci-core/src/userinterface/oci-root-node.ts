/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { TreeItemCollapsibleState } from "vscode";
import { IRootNode } from "./root-node";

export declare abstract class RootNode implements IRootNode {
    public id: string;
    public label: string;
    public readonly collapsibleState: TreeItemCollapsibleState;
    public readonly lightIcon: string | undefined;
    public readonly darkIcon: string | undefined;
    public readonly commandName: string;
    public readonly commandArgs: any[];
    public readonly context: string;
    public readonly childrenNodes: IRootNode[];
    public readonly parent: IRootNode | undefined;
    public description: string | undefined;
    public readonly tooltip: string | undefined;

    constructor(
        id: string,
        label: string,
        collapsibleState: TreeItemCollapsibleState,
        lightIcon: string,
        darkIcon: string,
        commandName: string,
        commandArgs: any[],
        context: string,
        childrenNodes: RootNode[],
        parent: RootNode | undefined,
        description: string | undefined,
        tooltip: string | undefined,
    );

    updateLabel(newLabel: string): void;
    updateDescription(newDescription: string): void;
    getParentNode(): IRootNode | undefined;
    getChildren(element: any): Thenable<IRootNode[]>;
    updateParentNode(n: IRootNode): void;
}
