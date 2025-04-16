/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { ExtensionContext, TreeView } from 'vscode';
import { IOCIProfileTreeDataProvider, IOCIApi, IRootNode } from './oci-api';

export namespace ext {
    export let context: ExtensionContext;
    export let treeDataProvider: IOCIProfileTreeDataProvider;
    export let treeView: TreeView<IRootNode>;

    export let api: IOCIApi;
}
