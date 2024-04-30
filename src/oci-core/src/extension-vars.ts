/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { ExtensionContext, EventEmitter, TreeView } from 'vscode';
import {IOCIApi} from './api/oci-api';
import {IOCIProfile} from './profilemanager/profile';
import {IRootNode} from './userinterface/root-node';
import {IOCIProfileTreeDataProvider} from './userinterface/profile-tree-data-provider';

export namespace ext {
    export let context: ExtensionContext;
    export let treeDataProvider: IOCIProfileTreeDataProvider;
    export let treeView: TreeView<IRootNode>;
    export let hasAccount: boolean;
    export let rootNodeName: string;

    export let api: IOCIApi;
    export let onProfileChangedEventEmitter: EventEmitter<IOCIProfile>;
    export let onSignInCompletedEventEmitter: EventEmitter<string>;
    export let onResourceNodeClickedEventEmitter: EventEmitter<IRootNode>;
    export let onAccountCreatedEventEmitter: EventEmitter<void>;
}
