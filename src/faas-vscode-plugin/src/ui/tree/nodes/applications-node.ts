/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */


import { ApplicationsItem } from '../../commands/resources';
import { IOCIProfile } from '../../../oci-api';
import * as vscode from 'vscode';
import { getResourcePath } from '../../../utils/path-utils';
import { RootNode } from './rootNode';
import { OCIApplicationNode } from './oci-application-node';
import { getApplications } from '../../../api/function';

export class ApplicationsNode extends RootNode {
    public profileName: IOCIProfile;
    public compartmentId: string;
    constructor(profileName: IOCIProfile, compartmentId: string) {
        super(
            `staticApplicationNode-${compartmentId}`,
            ApplicationsItem.label,
            vscode.TreeItemCollapsibleState.Collapsed,
            // get accurate icons from PMs.
            getResourcePath('light/application-light.svg'),
            getResourcePath('dark/application-dark.svg'),
            ApplicationsItem.commandName,
            [],
            ApplicationsItem.context,
            [],
        );
        this.profileName = profileName;
        this.compartmentId = compartmentId;
    }

    getChildren(_element: any): Thenable<RootNode[]> {
        // Get the compartments
        const appNodes: RootNode[] = [];
        return getApplications(this.profileName.getProfileName(), this.compartmentId,)
            .then((apps) => {
                for (const a of apps) {
                    appNodes.push(new OCIApplicationNode(a, this.profileName.getProfileName(), this));
                }
                return Promise.all(appNodes);
            });
    }
}
