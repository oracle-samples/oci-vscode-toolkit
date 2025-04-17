/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */


import { WorkersItem } from '../../commands/resources';
import * as vscode from 'vscode';
import { getResourcePath } from '../../../utils/path-utils';
import { RootNode } from './rootNode';
import { ListWorkers } from '../../../api/apmsynthetics';
import { OCIApmSynWorkerSummaryNode } from './oci-apm-syn-worker-summary-node';

export class WorkersNode extends RootNode {
    public compartmentId: string;
    public profileName: string;
    public apmDomainId: string;
    public onPremiseVantagePointId: string;
    public outputChannel: vscode.OutputChannel;
    public children: (OCIApmSynWorkerSummaryNode)[] = [];
    constructor(compartmentId: string, profileName: string, apmDomainId: string, onPremiseVantagePointId: string, outputChannel: vscode.OutputChannel) {
        super(
            `staticWorkerNode-${onPremiseVantagePointId}`,
            WorkersItem.label,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/opvp-worker-light.svg'),
            getResourcePath('dark/opvp-worker-dark.svg'),
            WorkersItem.commandName,
            [],
            WorkersItem.context,
            [],
        );
        this.compartmentId = compartmentId;
        this.profileName = profileName;
        this.apmDomainId = apmDomainId;
        this.onPremiseVantagePointId = onPremiseVantagePointId;
        this.outputChannel = outputChannel;
    }

    getApmDomainId(): string {
        return this.apmDomainId!;
    }

    getOnPremiseVantagePoint(): string {
        return this.onPremiseVantagePointId!;
    }

    getOutputChannel(): vscode.OutputChannel {
        return this.outputChannel;
    }

    getChildren(_element: any): Thenable<RootNode[]> {
        return ListWorkers(this.apmDomainId, this.onPremiseVantagePointId, this.profileName,)
            .then((workers) => {
                for (const workerSummary of workers) {
                    this.children.push(new OCIApmSynWorkerSummaryNode(this.compartmentId,
                        workerSummary, this.apmDomainId, this.onPremiseVantagePointId, this.profileName,
                        this.outputChannel, this)
                    );
                }
                return Promise.all(this.children);
            });
    }
}
