/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { getResourcePath } from "../../../utils/path-utils";
import { OCIApmSynMonitorSummaryNodeItem } from "../../commands/resources";
import { MonitorStatus, MonitorSummary, ScriptedBrowserMonitorConfiguration, VantagePointInfo } from "oci-apmsynthetics/lib/model";
import { MonitorsNode } from "./monitors-node";
import { RootNode } from "./rootNode";
import { OCINode } from './ociNode';
import { ext } from '../../../extensionVars';

export class OCIApmSynMonitorSummaryNode extends OCINode {
    public compartmentId: string;
    public profileName: string;
    public readonly synMonSummary: MonitorSummary;
    public readonly apmDomainId: string;
    public children: (OCIApmSynMonitorSummaryNode)[] = [];
    public outputChannel: vscode.OutputChannel;
    constructor(
        compartmentId: string,
        synMonSummary: MonitorSummary,
        apmDomainId: string,
        profileName: string,
        parent: MonitorsNode,
        outputChannel: vscode.OutputChannel,
    ) {
        super(
            synMonSummary.id,
            synMonSummary.displayName,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/monitor-light.svg'),
            getResourcePath('dark/monitor-dark.svg'),
            OCIApmSynMonitorSummaryNodeItem.commandName,
            [],
            OCIApmSynMonitorSummaryNodeItem.context,
            [],
            parent,
            ''
        );
        this.compartmentId = compartmentId;
        this.profileName = profileName;
        this.synMonSummary = synMonSummary;
        this.apmDomainId = apmDomainId;
        this.outputChannel = outputChannel;
    }

    getCompartmentId(): string {
        return this.compartmentId;
    }

    getApmDomainId(): string {
        return this.apmDomainId;
    }

    getMonitorId(): string {
        return this.synMonSummary.id;
    }

    getMonitorName(): string {
        return this.synMonSummary.displayName;
    }

    getMonitorType(): string {
        return this.synMonSummary.monitorType.toString();
    }

    getMonitorStatus(): MonitorStatus {
        return this.synMonSummary.status;
    }

    getVantagePoints(): Array<VantagePointInfo> {
        return this.synMonSummary.vantagePoints;
    }

    getOutputChannel(): vscode.OutputChannel {
        return this.outputChannel;
    }

    async getConsoleUrl(region: string): Promise<string> {
        var url = `https://cloud.oracle.com/apm/synthetics/${this.getMonitorId()}/domains/${this.getApmDomainId()}/compartments/${this.compartmentId}?region=${region}`;
        return url;
    }

    getChildren(_element: any): Thenable<RootNode[]> {
        return Promise.all(this.children);
    }
}

