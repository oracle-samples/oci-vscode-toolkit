/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

 import * as vscode from 'vscode';
 import { getCompartments, getTenancy } from '../../api/identity-client';
 import { getResourcePath } from '../../utils/path-utils';
 import { BaseNode } from './base-node';
 import {IRootNode, IOCIBasicResource} from '../../oci-api';
 import {IOCICompartment} from '../../resourceinterfaces/ioci-compartment';
 import { RootNode } from './rootNode';
 import { IOCIResourceNode } from '../../resourceinterfaces/ioci-resource-node';
 import { ext } from '../../extensionVars';
 import { StacksNode } from './static-stacks-node';
 import path = require('path');
 
 export async function createCompartmentNodes(): Promise<IRootNode[]> {
    const profile = ext.api.getCurrentProfile();
    const parentCompartmentId = profile.getTenancy();
    const profileName = profile.getProfileName();
    const nodes: IRootNode[] = [];

    // Insert  root tenancy as first compartment
    const tenancy = await getTenancy(parentCompartmentId);
    const parentNode = new OCICompartmentNode(tenancy, profileName, undefined, []);
    nodes.push(parentNode);

    const compartments = await getCompartments({
        profile: profileName,
        rootCompartmentId: parentCompartmentId,
        allCompartments: false,
    });
    
    // Create the compartment nodes
    for (const c of compartments) {
        nodes.push(new OCICompartmentNode(c, profileName, parentNode, []));
    }
    return Promise.resolve(nodes);
}

 export class OCICompartmentNode extends BaseNode
     implements IRootNode, IOCIResourceNode {
     public profileName: string;
     public readonly compartment: IOCICompartment;
     public readonly parent: RootNode | undefined;

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
             getResourcePath(path.join('light', 'single-compartment-light.svg')),
             getResourcePath(path.join('dark', 'single-compartment-dark.svg')),
             'oci-core.OCICompartmentNodeItem',
             [],
             'OCICompartmentNode',
             children,
             parent,
             '',
             '',
         );
         this.profileName = profileName;
         this.compartment = compartment;
         this.parent = parent;
     }
 
     getResourceId(): string {
         return this.compartment.id!;
     }

     getResource(): IOCIBasicResource {
         return {} as IOCIBasicResource;
     }

     async getConsoleUrl(region: string): Promise<string> {
        var tenancy_id = ext.api.getCurrentProfile().getTenancy();
        var tenancy_name = await getTenancy(tenancy_id);
        return `https://cloud.oracle.com/resourcemanager/stacks?region=${region}&tenant=${tenancy_name.description}`;
    }
 
     // Returns the children for the given element or root if element is not provided
     // When tree is opened, getChildren gets called without an element and you return the
     // top-level items. After that getChildren gets called for each top-level item
     getChildren(_element: any): Thenable<RootNode[]> {
        const childNodes: RootNode[] = [
            new StacksNode(this.compartment.id!),
        ];

        const compartmentIsTenancyRoot = this.compartment.id === ext.api.getCurrentProfile().getTenancy();
        if (compartmentIsTenancyRoot) {
            return Promise.all(childNodes);
        } else {
            return getCompartments({
                profile: this.profileName,
                rootCompartmentId: this.compartment.id!,
                allCompartments: false,
            }).then((compartments) => {
                // Create the compartment nodes
                for (const c of compartments) {
                    childNodes.push(
                        new OCICompartmentNode(c, this.profileName, this, []),
                    );
                }
                return childNodes;
            });
        }
    }
 }
 
