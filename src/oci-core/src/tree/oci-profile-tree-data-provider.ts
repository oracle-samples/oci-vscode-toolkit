/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import { OCIProfileNode } from './oci-profile-node';
import {NodeCreatorFunc} from '../api/oci-api';
import { BaseNode } from '../userinterface/base-node';
import assert from '../util/assert';
import {IRootNode} from '../userinterface/root-node';
import {IOCIProfileTreeDataProvider} from '../userinterface/profile-tree-data-provider';
import {IOCIProfile} from '../profilemanager/profile';
import { getLogger } from '../logger/logging';
import * as nls from 'vscode-nls';
import { ext } from '../extension-vars';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

const logger = getLogger("oci-vscode-toolkit");

// This is the tree view with Profile node as root
export class OCIProfileTreeDataProvider 
    implements vscode.TreeDataProvider<IRootNode>, IOCIProfileTreeDataProvider {
    private readonly _onDidChangeTreeData: vscode.EventEmitter<
        BaseNode | undefined
    > = new vscode.EventEmitter<BaseNode | undefined>();

    readonly onDidChangeTreeData: vscode.Event<BaseNode | undefined> = this
        ._onDidChangeTreeData.event;

    private readonly _rootNodeCreator: NodeCreatorFunc | undefined;
    private readonly _childNodeCreator: NodeCreatorFunc | undefined;
    private _rootNode: IRootNode | undefined;

    constructor(
        profile: IOCIProfile,
        ociConfigExists: boolean,
        rootNodeCreatorFunc?: NodeCreatorFunc,
        profileChildrenCreatorFunc?: NodeCreatorFunc,
    ) {
            if (ociConfigExists) {
                ext.rootNodeName = "Compartments";
                this._rootNode = new OCIProfileNode(
                    profile,
                    profile.getProfileName(),
                    ext.rootNodeName,
                    profile.getRegionName(),
                    profile.usesSessionAuth(),
                    profileChildrenCreatorFunc
                );
            } else {
                const profileNamePlaceHolderText = localize("profileNamePlaceHolderText", "Please Sign in");
                this._rootNode = new OCIProfileNode(
                    {} as IOCIProfile,
                    profileNamePlaceHolderText,
                    ext.rootNodeName,
                    '',
                    false,
                    profileChildrenCreatorFunc,
                    vscode.TreeItemCollapsibleState.None,
                );
            }
          this._rootNodeCreator = rootNodeCreatorFunc;
          this._childNodeCreator = profileChildrenCreatorFunc;
    }

    refresh(treeItem: BaseNode | undefined): void {
        this._onDidChangeTreeData.fire(treeItem);
    }

    getParent(element: IRootNode): IRootNode | undefined {
        return element.getParentNode();
    }

    // Returns the UI representation of the element that gets displayed in the view
    getTreeItem(element: IRootNode): vscode.TreeItem {
        return {
            id: element.id,
            label: element.label,
            description: element.description,
            collapsibleState: element.collapsibleState,
            iconPath: element.lightIcon && element.darkIcon ? {light: element.lightIcon,dark: element.darkIcon,} : undefined,
            command: {
                command: element.commandName,
                title: '',
                arguments: element.commandArgs,
                tooltip: '',
            },
            tooltip: element.tooltip,
            contextValue: element.context,
        };
    }

    // Returns the children for the given element or root if element is not provided
    // When tree is opened, getChildren gets called without an element and you return the
    // top-level items. After that getChildren gets called for ecah top-level item
    getChildren(element?: IRootNode): Thenable<IRootNode[]> {
        if (!this._rootNode) {
            return Promise.resolve([]);
        }
        if (!element) {
            if (this._rootNodeCreator) {
                return this._rootNodeCreator().then((rootNodes) => {
                    assert(this._rootNode);
                    for (const n of rootNodes) {
                        n.updateParentNode(this._rootNode);
                    }
                    return Promise.all([this._rootNode, ...rootNodes]);
                });
            }
            return Promise.resolve([this._rootNode]);
        }
        return element.getChildren(element);
    }

    // Trigger the profile change
    async switchProfile(profile: IOCIProfile): Promise<void> {
        this._rootNode = new OCIProfileNode(
            profile,
            profile.getProfileName(),
            ext.rootNodeName,
            profile.getRegionName(),
            profile.usesSessionAuth(),
            this._childNodeCreator,
        );
    }


    // Finds tree item and used for revealing subtree of provided node id
    private async findItem(
        nodeId: string,
        root: IRootNode,
    ): Promise<IRootNode | undefined> {

        let result: IRootNode | undefined = undefined;
        try {
            const nodeStack = new Array<IRootNode>();
            nodeStack.push(root);

            while (nodeStack.length > 0) {
                const currentNode = nodeStack.pop();
                if (currentNode?.id === nodeId) {
                    result = currentNode;
                    break;
                }
                
                try {
                    const children = await currentNode?.getChildren(undefined);
                    if (children && children.length > 0) {
                        nodeStack.push(...children);
                    }
                } catch (error) {
                    // To bypass auth access error 400 for inaccessible compartments 
                    continue;
                }
            }
        } catch (error) {
            const findTreeItemErrorMsg = localize("findTreeItemErrorMsg", "Error occured while searching tree item ");
            logger.error(findTreeItemErrorMsg, nodeId);
            throw error;
        }
        return result;
    }

    async findTreeItem(nodeId: string): Promise<IRootNode | undefined> {
        return this.findItem(nodeId, this._rootNode!);
    }
}
