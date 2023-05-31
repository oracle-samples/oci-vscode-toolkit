/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import {IRootNode} from './root-node';
import {IOCIProfile} from '../profilemanager/profile';
import { TreeItem } from 'vscode';

export interface IOCIProfileTreeDataProvider {
    switchProfile(profile: IOCIProfile): Promise<void>;
    refresh(treeItem: IRootNode | undefined): void;

    getTreeItem(element: IRootNode): TreeItem;
    getChildren(element?: IRootNode): Thenable<IRootNode[]>;
    findTreeItem(nodeId: string): Promise<IRootNode | undefined>;
}
