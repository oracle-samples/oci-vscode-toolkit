/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { getResourcePath } from "../../../utils/path-utils";
import { OCIApmSynWorkerSummaryNodeItem } from "../../commands/resources";
import { WorkerSummary } from "oci-apmsynthetics/lib/model";
import { WorkersNode } from "./workers-node";
import { RootNode } from "./rootNode";
import { OCINode } from './ociNode';

export class OCIApmSynWorkerSummaryNode extends OCINode {
    public compartmentId: string;
    public profileName: string;
    public readonly synWorkerSummary: WorkerSummary;
    public readonly apmDomainId: string;
    public readonly opvpId: string;
    outputChannel: vscode.OutputChannel;
    public children: (OCIApmSynWorkerSummaryNode)[] = [];
    constructor(
        compartmentId: string,
        synWorkerSummary: WorkerSummary,
        apmDomainId: string,
        opvpId: string,
        profileName: string,
        outputChannel: vscode.OutputChannel,
        parent: WorkersNode
    ) {
        super(
            synWorkerSummary.id,
            synWorkerSummary.displayName,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/opvp-worker-light.svg'),
            getResourcePath('dark/opvp-worker-dark.svg'),
            OCIApmSynWorkerSummaryNodeItem.commandName,
            [],
            OCIApmSynWorkerSummaryNodeItem.context,
            [],
            parent,
            ''
        );
        this.compartmentId = compartmentId;
        this.profileName = profileName;
        this.synWorkerSummary = synWorkerSummary;
        this.apmDomainId = apmDomainId;
        this.opvpId = opvpId;
        this.outputChannel = outputChannel;
    }

    getCompartmentId(): string {
        return this.compartmentId;
    }

    getApmDomainId(): string {
        return this.apmDomainId;
    }

    getOpvpId(): string {
        return this.opvpId;
    }

    getWorkerId(): string {
        return this.synWorkerSummary.id;
    }

    getOutputChannel(): vscode.OutputChannel {
        return this.outputChannel;
    }

    getChildren(_element: any): Thenable<RootNode[]> {
        const localize: nls.LocalizeFunc = nls.loadMessageBundle();
        let monitorList = {};
        if (this.synWorkerSummary.monitorList) {
            monitorList = this.synWorkerSummary.monitorList.map(element => {
                return element.displayName;
            });
        }

        let workerObj: WorkerSummary = JSON.parse(JSON.stringify(this.synWorkerSummary));
        workerObj.timeUpdated = new Date("" + workerObj.timeUpdated);

        this.outputChannel.appendLine(localize('workerSummary', '---Worker Summary---'));
        this.outputChannel.appendLine(localize('workerDetails', "Worker Name: {0} \nType: {1} \nWorker update time: {2} \nPriority: {3} \nStatus:{4} \nMonitorList: {5} \nVersion: {6} \nWorker Ocid: {7}",
            this.synWorkerSummary.displayName, this.synWorkerSummary.workerType, workerObj.timeUpdated?.toUTCString(), this.synWorkerSummary.priority, this.synWorkerSummary.status, JSON.stringify(monitorList), this.synWorkerSummary.versionDetails?.latestVersion, this.synWorkerSummary.id));
        this.outputChannel.appendLine('\n');

        return Promise.all(this.children);
    }
}

