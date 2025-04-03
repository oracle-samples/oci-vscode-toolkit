/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';

import { RootNode } from './rootNode';
import { IOCIResource } from '../../../resourceinterfaces/ioci-resource';
import { IRootNode } from '../../../oci-api';

// Represents a OCI-aware node in the tree view
export class OCINode extends RootNode implements IRootNode {
    constructor(
        public id: string,
        public label: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly lightIcon: string,
        public readonly darkIcon: string,
        public readonly commandName: string,
        public readonly commandArgs: any[],
        public readonly context: string,
        public readonly childrenNodes: OCINode[] = [],
        parent: RootNode | undefined = undefined,
        description: string | undefined = undefined,
        tooltip: string | undefined = undefined,
    ) {
        super(
            id,
            label,
            collapsibleState,
            lightIcon,
            darkIcon,
            commandName,
            commandArgs,
            context,
            childrenNodes,
            parent,
            description,
            tooltip,
        );
    }
}
