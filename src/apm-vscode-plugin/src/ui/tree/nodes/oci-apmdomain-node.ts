/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { OCINode } from "./ociNode";
import * as vscode from 'vscode';
import { getResourcePath } from "../../../utils/path-utils";
import { OCIAPMDomainNodeItem } from "../../commands/resources";
import { Repository } from "../../../git";
import { RootNode } from './rootNode';
import { ApmDomainSummary } from "oci-apmcontrolplane/lib/model/apm-domain-summary";
import { MonitorsNode } from "./monitors-node";
import { ScriptsNode } from "./scripts-node";
import { OnPremiseVantagePointsNode } from "./opvps-node";
//import { WorkersNode } from "./workers-node";

function getDescriptionFromState(resourceState: string | undefined): string {
    switch (resourceState) {
        case 'ACTIVE': {
            return 'Active';
        }
        case 'CREATING':
        case 'UPDATING':
        case 'DELETING': {
            return 'Updating';
        }
        case 'DELETED':
        case 'FAILED': {
            return 'Deleted';
        }
        default: {
            return 'Updating';
        }
    }
}

export class OCIApmDomainNode extends OCINode {
    public profileName: string;
    repository: Repository | null | undefined;
    public compartmentId: string;
    public readonly apmDomain: ApmDomainSummary;
    public uriRepo: vscode.Uri | undefined = undefined;
    public outputChannel: vscode.OutputChannel;
    // public children: (MonitorsNode | ScriptsNode | OnPremiseVantagePointsNode | OCIApmDomainNode)[] = [];
    public children: (MonitorsNode | ScriptsNode | OCIApmDomainNode)[] = [];
    isGitRepo: boolean = false;
    constructor(
        compartmentId: string,
        apmDomain: ApmDomainSummary,
        profileName: string,
        parent: RootNode | undefined,
        outputChannel: vscode.OutputChannel
    ) {
        super(
            apmDomain.id,
            apmDomain.displayName,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/apmdomain-light.svg'),
            getResourcePath('dark/apmdomain-dark.svg'),
            OCIAPMDomainNodeItem.commandName,
            [],
            OCIAPMDomainNodeItem.context,
            [],
            parent,
            '',
            `Click to expand ${apmDomain.displayName}`
        );
        this.compartmentId = compartmentId;
        this.profileName = profileName;
        this.apmDomain = apmDomain;
        this.outputChannel = outputChannel;
    }

    getResourceId(): string {
        return this.apmDomain.id!;
    }

    // async getChildren(_element: any): Promise<(MonitorsNode | ScriptsNode | OnPremiseVantagePointsNode | OCIApmDomainNode)[]> {
    async getChildren(_element: any): Promise<(MonitorsNode | ScriptsNode | OCIApmDomainNode)[]> {
        this.children = [];
        this.children.push(new MonitorsNode(this.compartmentId, this.profileName, this.apmDomain.id!, this, this.outputChannel));
        this.children.push(new ScriptsNode(this.compartmentId, this.profileName, this.apmDomain.id!, this, this.outputChannel));
        //this.children.push(new OnPremiseVantagePointsNode(this.compartmentId, this.profileName, this.apmDomain.id!, this.outputChannel));
        return Promise.all(this.children);
    }
}
