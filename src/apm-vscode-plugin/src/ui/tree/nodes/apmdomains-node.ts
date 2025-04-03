/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */


import { ApmDomainsItem } from '../../commands/resources';
import { IOCIProfile } from '../../../oci-api';
import * as vscode from 'vscode';
import { getResourcePath } from '../../../utils/path-utils';
import { RootNode } from './rootNode';
import { listDomains } from '../../../api/apmdomain';
import { OCIApmDomainNode } from './oci-apmdomain-node';

export class ApmDomainsNode extends RootNode {
    public profileName: IOCIProfile;
    public compartmentId: string;
    public outputChannel: vscode.OutputChannel;
    constructor(profileName: IOCIProfile, compartmentId: string,
        parent: RootNode | undefined,
        outputChannel: vscode.OutputChannel) {
        super(
            `staticApmDomainNode-${compartmentId}`,
            ApmDomainsItem.label,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/apmdomain-light.svg'),
            getResourcePath('dark/apmdomain-dark.svg'),
            ApmDomainsItem.commandName,
            [],
            ApmDomainsItem.context,
            [],
            parent,
            '',
            `Click to extand ${ApmDomainsItem.label}`
        );
        this.profileName = profileName;
        this.compartmentId = compartmentId;
        this.outputChannel = outputChannel;
    }

    getChildren(_element: any): Thenable<RootNode[]> {
        // Get the compartments
        const apmDomainNodes: RootNode[] = [];

        return listDomains(this.compartmentId, this.profileName.getProfileName())
            .then((domainList) => {
                for (const domain of domainList.items) {
                    apmDomainNodes.push(new OCIApmDomainNode(this.compartmentId, domain, this.profileName.getProfileName(), this, this.outputChannel));
                }
                return Promise.all(apmDomainNodes);
            });
    }
}
