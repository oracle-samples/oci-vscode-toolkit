/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

// Represents an OCI Application
import * as vscode from 'vscode';
import { OCINode } from './ociNode';
import { RootNode } from '../../../oci-api';
import { getResourcePath } from '../../../utils/path-utils';
import { OCIApplicationNodeItem, OCIConfigurationApplicationRootNodeItem } from '../../commands/resources';
import { IOCIResource } from '../../../api/types';
import { getApplication, getFunctions } from "../../../api/function";
import { OCIConfigurationRootNode } from './oci-configuration-node';
import { OCIFunctionNode } from './oci-function-node';
import { logger } from '../../../utils/get-logger';
import { OCINewFunctionNode } from './oci-new-function-node';

export function getCreateApplicationUrl(consoleUrl: string) {
    return `${consoleUrl}/functions`;
}

export function getDeleteApplicationUrl(consoleUrl: string, ocid: string) {
    return `${consoleUrl}/functions/apps/${ocid}/fns`;
}

export function getEditApplicationUrl(consoleUrl: string, ocid: string) {
    return `${consoleUrl}/functions/apps/${ocid}/config`;
}

export class OCIApplicationNode extends OCINode {
    public profileName: string;
    public appSummary: IOCIResource;
    public static newFunctionCounter: number = 0;
    public children: (OCINewFunctionNode | OCIFunctionNode | OCIConfigurationRootNode)[] = [];
    public static newFunctions: OCINewFunctionNode[] = [];
    constructor(
        app: IOCIResource,
        profileName: string,
        parent: RootNode | undefined,
    ) {
        super(
            app,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/application-light.svg'),
            getResourcePath('dark/application-dark.svg'),
            OCIApplicationNodeItem.commandName,
            [],
            OCIApplicationNodeItem.context,
            [],
            parent,
            ''
        );
        this.profileName = profileName;
        this.appSummary = app;
    }

    async getChildren(element: any): Promise<(OCIFunctionNode | OCINewFunctionNode | OCIConfigurationRootNode)[]> {
        //populate nodes with existing function
        if (this.children.length === 0) {
            await this.populateChildren(element);
        }
        //Check if any newly created functions are pending to be added to the tree
        if (OCIApplicationNode.newFunctions.length > 0) {
            //move the new created function to children if it is not added and belongs to the right application
            OCIApplicationNode.newFunctions.forEach(curr => {
                if (!newFunctionNodeAdded(curr, this.children) && curr.parent?.id === this.id) {
                    this.children.push(curr);
                }
            });
        }
        return Promise.all(this.children);
    }

    async populateChildren(_element: any): Promise<void> {
        try {
            const id = this.appSummary.id;
            // Get the details of the application, so we can get configuration
            let funcs = await getFunctions(this.profileName, id!);
            funcs.forEach(f => {
                this.children.push(new OCIFunctionNode(
                    f,
                    this.profileName,
                    f.lifecycleState,
                    f.image,
                    this,
                ));
            });
            let app = await getApplication(this.profileName, id!);
            this.children.push(new OCIConfigurationRootNode(this.profileName, app, this, OCIConfigurationApplicationRootNodeItem.commandName, OCIConfigurationApplicationRootNodeItem.context));
        } catch (error) {
            logger().error("Error in fetching functions from API.");
        }
    }
}

function newFunctionNodeAdded(newFuncNode: OCINewFunctionNode, treeNodes: (OCINewFunctionNode | OCIFunctionNode | OCIConfigurationRootNode)[]) {
    for (let treeNode of treeNodes) {
        if (treeNode.id === newFuncNode.id) {
            return true;
        }
    }
    return false;
} 
