/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import { getCompartments } from '../../../api/identity';
import { getResourcePath } from '../../../utils/path-utils';
import { BaseNode } from './base-node';
import { IRootNode, IOCIBasicResource } from '../../../oci-api';
import { IOCICompartment } from '../../../resourceinterfaces/ioci-compartment';
import { RootNode } from './rootNode';
import { IOCIResourceNode } from '../../../resourceinterfaces/ioci-resource-node';
import { ext } from '../../../extensionVars';
import { ApmDomainsNode } from './apmdomains-node';

export async function createCompartmentNodes(outputChannel: vscode.OutputChannel): Promise<IRootNode[]> {
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
        nodes.push(new OCICompartmentNode(c, profileName, undefined, [], outputChannel));
    }
    return Promise.resolve(nodes);
}

export class OCICompartmentNode extends BaseNode
    implements IRootNode, IOCIResourceNode {
    public profileName: string;
    public readonly compartment: IOCICompartment;
    public outputChannel: vscode.OutputChannel;
    constructor(
        compartment: IOCICompartment,
        profileName: string,
        parent: RootNode | undefined,
        children: RootNode[],
        outputChannel: vscode.OutputChannel
    ) {
        super(
            compartment.id || 'unknownID',
            compartment.name,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/compartment-light.svg'),
            getResourcePath('dark/compartment-dark.svg'),
            'oci-core.OCICompartmentNodeItem',
            [],
            'OCICompartmentNode',
            children,
            parent,
            '',
            `Click to expand ${compartment.name}`,
        );
        this.profileName = profileName;
        this.compartment = compartment;
        this.outputChannel = outputChannel;
    }

    getResourceId(): string {
        return this.compartment.id!;
    }

    getResource(): IOCIBasicResource {
        return {} as IOCIBasicResource;
    }

    async getConsoleUrl(region: string): Promise<string> {
        var tenancy_id = ext.api.getCurrentProfile().getTenancy();
        var url = `https://cloud.oracle.com/apm/synthetics?region=${region}&tenant=${tenancy_id}`;
        return url;
    }

    // Returns the children for the given element or root if element is not provided
    // When tree is opened, getChildren gets called without an element and you return the
    // top-level items. After that getChildren gets called for each top-level item
    getChildren(_element: any): Thenable<RootNode[]> {
        // Get the compartments
        const apmDomainNodes: RootNode[] = [];


        // return only resources for root node.
        if (this.compartment.id === ext.api.getCurrentProfile().getTenancy()) {
            apmDomainNodes.push(new ApmDomainsNode(ext.api.getCurrentProfile(), this.compartment.id!, this, this.outputChannel));
            return Promise.all(apmDomainNodes);
        }
        else {
            return getCompartments({
                profile: this.profileName,
                rootCompartmentId: this.compartment.id!,
                allCompartments: false,
            })
                .then((compartments) => {
                    // Create the compartment nodes
                    for (const c of compartments) {
                        apmDomainNodes.push(
                            new OCICompartmentNode(c, this.profileName, this, [], this.outputChannel),
                        );
                    }
                    apmDomainNodes.push(new ApmDomainsNode(ext.api.getCurrentProfile(), this.compartment.id!, this, this.outputChannel));
                    return Promise.all(apmDomainNodes);
                });
        }
    }
}
