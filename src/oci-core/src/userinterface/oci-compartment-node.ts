/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import { getCompartments } from '../api/oci-sdk-client';
import { getResourcePath } from '../util/path-utils';
import { ociCompartmentNodeCommand } from '../util/resources';
import assert from '../util/assert';
import { BaseNode } from './base-node';
import { ext } from '../extension-vars';
import { createBasicResources } from '../tree/oci-basic-resource';
import {IRootNode} from './root-node';
import {IOCIBasicResource} from './basic-resource';
import {IOCICompartment} from './compartment';
import { RootNode } from './oci-root-node';

// Creates the first level of compartments, starting from the tenancy level.
export async function createCompartmentNodes(): Promise<IRootNode[]> {
    const profile = ext.api.getCurrentProfile();
    const parentCompartmentId = profile.getTenancy();
    const profileName = profile.getProfileName();
    const nodes: IRootNode[] = [];

    const compartments = await getCompartments({
        profile: profileName,
        rootCompartmentId: parentCompartmentId,
        allCompartments: false,
    });
    // Create the compartment nodes
    for (const c of compartments) {
        nodes.push(new OCICompartmentNode(c, profileName, undefined, []));
    }
    return Promise.resolve(nodes);
}

export interface IOCIResourceNode {
    getResourceId(): string;
    // Gets the full Console URL to the resource
    getConsoleUrl(region: string): Promise<string>;
    getResource(): IOCIBasicResource;
}

class OCICompartmentNode extends BaseNode
    implements IRootNode, IOCIResourceNode {
    public profileName: string;
    public readonly compartment: IOCICompartment;
    constructor(
        compartment: IOCICompartment,
        profileName: string,
        parent: RootNode | undefined,
        children: RootNode[],
    ) {
        super(
            compartment.id || 'unknownID',
            compartment.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('compartment-light.svg'),
            getResourcePath('compartment-dark.svg'),
            ociCompartmentNodeCommand,
            [],
            'OCICompartmentNode',
            children,
            parent,
            '',
            '',
        );
        this.profileName = profileName;
        this.compartment = compartment;
    }

    getResourceId(): string {
        assert(this.compartment.id);
        return this.compartment.id;
    }

    async getConsoleUrl(region: string): Promise<string> {
        const consoleUrl = await ext.api.getConsoleUrl(region);
        return `${consoleUrl}/identity/compartments/explorer?compartmentId=${this.getResourceId()}`;
    }

    getResource(): IOCIBasicResource {
        return {} as IOCIBasicResource;
    }

    // Returns the children for the given element or root if element is not provided
    // When tree is opened, getChildren gets called without an element and you return the
    // top-level items. After that getChildren gets called for ecah top-level item
    getChildren(element: any): Thenable<RootNode[]> {
        assert(this.compartment.id);
        // Get the compartments
        const childNodes: RootNode[] = [];
        return getCompartments({
            profile: this.profileName,
            rootCompartmentId: this.compartment.id,
            allCompartments: false,
        })
            .then((compartments) => {
                // Create the compartment nodes
                for (const c of compartments) {
                    childNodes.push(
                        new OCICompartmentNode(c, this.profileName, this, []),
                    );
                }

                assert(this.compartment.id);
                // Retrieve all resources under this compartment
                return createBasicResources(
                    this.profileName,
                    this,
                    this.compartment.id,
                );
            })
            .then((otherResources) => {
                childNodes.push(...otherResources);
                return childNodes;
            });
    }
}
