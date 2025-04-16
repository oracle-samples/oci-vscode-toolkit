/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';

import { IOCIResource }       from "../../oci-api";
import { OCINode }            from "./ociNode";
import { OCIProjectNodeItem } from '../commands/resources';
import { OCIJobNode }         from './oci-job-node';
import * as nodeBuilder       from "./builders/node-builder";
import * as dataScience       from "../../api/oci/data-science";
import { getResourcePath }    from "../vscode_ext";

export class OCIProjectNode extends OCINode {
    constructor(project: IOCIResource) {
        super(
            project,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/each-project-light.svg'),
            getResourcePath('dark/each-project-dark.svg'),
            OCIProjectNodeItem.commandName,
            OCIProjectNodeItem.context,
            [],
        );
    }

    getChildren(_element: any): Thenable<OCIJobNode[]> {
        return nodeBuilder.makeSubnodes(
            () => dataScience.listJobs(this.resource.compartmentId!, this.resource.id!),
            OCIJobNode,
        );
    }      
}
