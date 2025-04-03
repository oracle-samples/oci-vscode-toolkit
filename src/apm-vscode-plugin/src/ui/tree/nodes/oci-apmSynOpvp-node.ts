/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { OCINode } from "./ociNode";
import * as vscode from 'vscode';
import { getResourcePath } from "../../../utils/path-utils";
import { OCIApmOpvpNodeItem } from "../../commands/resources";
import { Repository } from "../../../git";
import { RootNode } from './rootNode';
import { OnPremiseVantagePointSummary } from "oci-apmsynthetics/lib/model/on-premise-vantage-point-summary";
import { OnPremiseVantagePointsNode } from "./opvps-node";
import { WorkersNode } from "./workers-node";

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

export class OCIApmOpvpNode extends OCINode {
    public profileName: string;
    repository: Repository | null | undefined;
    public compartmentId: string;
    public apmDomainId: string;
    public readonly onPremiseVantagePoint: OnPremiseVantagePointSummary;
    public uriRepo: vscode.Uri | undefined = undefined;
    public outputChannel: vscode.OutputChannel;
    public children: (WorkersNode | OnPremiseVantagePointsNode)[] = [];
    isGitRepo: boolean = false;
    constructor(
        compartmentId: string,
        apmDomainId: string,
        onPremiseVantagePoint: OnPremiseVantagePointSummary,
        profileName: string,
        parent: RootNode | undefined,
        outputChannel: vscode.OutputChannel
    ) {
        super(
            onPremiseVantagePoint.id,
            onPremiseVantagePoint.displayName,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/opvp-light.svg'),
            getResourcePath('dark/opvp-dark.svg'),
            OCIApmOpvpNodeItem.commandName,
            [],
            OCIApmOpvpNodeItem.context,
            [],
            parent,
            ''
        );
        this.compartmentId = compartmentId;
        this.profileName = profileName;
        this.apmDomainId = apmDomainId;
        this.onPremiseVantagePoint = onPremiseVantagePoint;
        this.outputChannel = outputChannel;
    }

    getResourceId(): string {
        return this.onPremiseVantagePoint.id!;
    }

    getApmDomainId(): string {
        return this.apmDomainId!;
    }

    getOutputChannel(): vscode.OutputChannel {
        return this.outputChannel;
    }

    async getChildren(_element: any): Promise<(WorkersNode | OnPremiseVantagePointsNode)[]> {

        this.children.push(new WorkersNode(this.compartmentId, this.profileName,
            this.apmDomainId!, this.onPremiseVantagePoint.id, this.outputChannel));
        return Promise.all(this.children);
    }
}
