/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */


import { MonitorsItem } from '../../commands/resources';
import * as vscode from 'vscode';
import { getResourcePath } from '../../../utils/path-utils';
import { RootNode } from './rootNode';
import { listMonitors } from '../../../api/apmsynthetics';
import { OCIApmSynMonitorSummaryNode } from './oci-apm-syn-monitor-summary-node';

export class MonitorsNode extends RootNode {
    public compartmentId: string;
    public profileName: string;
    public apmDomainId: string;
    public outputChannel: vscode.OutputChannel;
    public children: (OCIApmSynMonitorSummaryNode)[] = [];
    constructor(compartmentId: string, profileName: string, apmDomainId: string,
        parent: RootNode | undefined, outputChannel: vscode.OutputChannel) {
        super(
            `staticMonitorNode-${apmDomainId}`,
            MonitorsItem.label,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/monitor-light.svg'),
            getResourcePath('dark/monitor-dark.svg'),
            MonitorsItem.commandName,
            [],
            MonitorsItem.context,
            [],
            parent,
            '',
            `Click to expand ${MonitorsItem.label}`
        );
        this.compartmentId = compartmentId;
        this.profileName = profileName;
        this.apmDomainId = apmDomainId;
        this.outputChannel = outputChannel;
    }

    getApmDomainId(): string {
        return this.apmDomainId!;
    }

    getOutputChannel(): vscode.OutputChannel {
        return this.outputChannel;
    }

    getChildren(_element: any): Thenable<RootNode[]> {
        this.children = [];
        return listMonitors(this.apmDomainId, this.profileName,)
            .then((monitors) => {
                for (const monitorSummary of monitors) {
                    this.children.push(new OCIApmSynMonitorSummaryNode(this.compartmentId, monitorSummary, this.apmDomainId, this.profileName, this, this.outputChannel));
                }
                return Promise.all(this.children);
            });
    }
}
