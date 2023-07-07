/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */


import * as vscode from 'vscode';
import { CompartmentsItem } from '../../commands/resources';
import { RootNode } from './rootNode';
import { OCICompartmentNode } from './oci-compartment-node';
import { getCompartments, getTenancy } from '../../../api/identity';
import { getResourcePath } from '../../../utils/path-utils';
import { ext } from '../../../extensionVars';

export class CompartmentsNode extends RootNode {
    constructor() {
        super(
            `compartmentsNode-faas`,
            CompartmentsItem.label,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/compartment-light.svg'),
            getResourcePath('dark/compartment-dark.svg'),
            CompartmentsItem.commandName,
            [],
            CompartmentsItem.context,
            [],
        );
    }

    // Returns the children for the given element or root if element is not provided
    // When tree is opened, getChildren gets called without an element and you return the
    // top-level items. After that getChildren gets called for each top-level item
    getChildren(_element: any): Thenable<RootNode[]> {
        const profile = ext.api.getCurrentProfile();
        const compartmentId = profile.getTenancy();
        // Get the compartments
        const childNodes: RootNode[] = [];

        // Add Tenancy Node first
        return getTenancy(compartmentId)
            .then((c) => {
                c.name = `${c.name}(root)`;
                childNodes.push(new OCICompartmentNode(c, profile.getProfileName(), this, []),);
                return getCompartments({
                    profile: profile.getProfileName(),
                    rootCompartmentId: compartmentId,
                    allCompartments: false,
                });
            }).then((compartments) => {
                // Create the compartment nodes
                for (const c of compartments) {
                    childNodes.push(
                        new OCICompartmentNode(c, profile.getProfileName(), this, []),
                    );
                }
                // Retrieve all resources under this compartment
                return Promise.resolve(childNodes);
            });
    }
}
