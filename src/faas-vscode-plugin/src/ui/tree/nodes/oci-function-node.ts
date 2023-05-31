/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { OCINode } from "./ociNode";
import * as vscode from 'vscode';
import { getResourcePath } from "../../../utils/path-utils";
import { OCIFunctionNodeItem, OCIConfigurationFunctionRootNodeItem } from "../../commands/resources";
import { IOCIFunction } from "../../../api/types";
import { getFunction } from "../../../api/function";
import { OCIConfigurationRootNode } from "./oci-configuration-node";
import { OCIApplicationNode } from "./oci-application-node";
import { OCIFileExplorerNode } from "../../../oci-api";
import { Repository } from "../../../git";

function getDescriptionFromState(resourceState: string | undefined): string {
    switch (resourceState) {
        case 'ACTIVE': {
            return 'Active';
        }
        case 'CREATING':
        case 'UPDATING':
        case 'DELETING': {
            return 'Updating';
        }
        case 'DELETED':
        case 'FAILED': {
            return 'Deleted';
        }
        default: {
            return 'Updating';
        }
    }
}

export class OCIFunctionNode extends OCINode {
    public profileName: string;
    repository: Repository | null | undefined;
    public readonly func: IOCIFunction;
    parent: OCIApplicationNode | undefined;
    public uriRepo: vscode.Uri | undefined = undefined;
    private children: (OCIFileExplorerNode | OCIConfigurationRootNode)[] = [];
    isGitRepo: boolean = false;
    public static newFunctions: OCIFileExplorerNode[] = [];
    constructor(
        func: IOCIFunction,
        profileName: string,
        state: string | undefined,
        tooltip: string | undefined,
        parent: OCIApplicationNode | undefined,
    ) {
        super(
            func,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/function-light.svg'),
            getResourcePath('dark/function-dark.svg'),
            OCIFunctionNodeItem.commandName,
            [],
            OCIFunctionNodeItem.context,
            [],
            parent,
            getDescriptionFromState(state),
            tooltip,
        );
        this.profileName = profileName;
        this.func = func;
        this.parent = parent;
    }

    async getChildren(_element: any): Promise<(OCIConfigurationRootNode | OCIFileExplorerNode)[]> {
        if (this.children.length === 0) {
            await this.getFnConfig();
        }
        if (OCIFunctionNode.newFunctions.length > 0) {
            OCIFunctionNode.newFunctions.forEach(curr => {
                if (!newFunctionNodeAdded(curr, this.children) && curr.parent?.id === this.id) {
                    this.children.push(curr);
                }
            });
        }
        return Promise.all(this.children);
    }
    async getFnConfig(): Promise<void> {
        await getFunction(this.profileName, this.func.id!).then((f) => {
            this.children.push(new OCIConfigurationRootNode(this.profileName, f, this, OCIConfigurationFunctionRootNodeItem.commandName, OCIConfigurationFunctionRootNodeItem.context));
        });
    }
}

function newFunctionNodeAdded(newFuncNode: OCIFileExplorerNode, treeNodes: (OCIConfigurationRootNode | OCIFileExplorerNode)[]) {
    for (let treeNode of treeNodes) {
        if (treeNode.id === newFuncNode.id) {
            return true;
        }
    }
    return false;
} 
