/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { getResourcePath } from "../../../utils/path-utils";
import { OCIApmSynScriptSummaryNodeItem } from "../../commands/resources";
import { ScriptSummary } from "oci-apmsynthetics/lib/model";
import { ScriptsNode } from "./scripts-node";
import { RootNode } from "./rootNode";
import { OCINode } from './ociNode';
import { listMonitorsForScript } from '../../../api/apmsynthetics';
import { ext } from '../../../extensionVars';

export class OCIApmSynScriptSummaryNode extends OCINode {
    public compartmentId: string;
    public profileName: string;
    public readonly synScriptSummary: ScriptSummary;
    public readonly apmDomainId: string;
    outputChannel: vscode.OutputChannel;
    public children: (OCIApmSynScriptSummaryNode)[] = [];
    constructor(
        compartmentId: string,
        synScriptSummary: ScriptSummary,
        apmDomainId: string,
        profileName: string,
        outputChannel: vscode.OutputChannel,
        parent: ScriptsNode
    ) {
        super(
            synScriptSummary.id,
            synScriptSummary.displayName,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/script-light.svg'),
            getResourcePath('dark/script-dark.svg'),
            OCIApmSynScriptSummaryNodeItem.commandName,
            [],
            OCIApmSynScriptSummaryNodeItem.context,
            [],
            parent,
            ''
        );
        this.compartmentId = compartmentId;
        this.profileName = profileName;
        this.synScriptSummary = synScriptSummary;
        this.apmDomainId = apmDomainId;
        this.outputChannel = outputChannel;
    }

    getCompartmentId(): string {
        return this.compartmentId;
    }

    getApmDomainId(): string {
        return this.apmDomainId;
    }

    getScriptId(): string {
        return this.synScriptSummary.id;
    }

    getScriptName(): string {
        return this.synScriptSummary.displayName;
    }

    getOutputChannel(): vscode.OutputChannel {
        return this.outputChannel;
    }

    async getConsoleUrl(region: string): Promise<string> {
        var url = `https://cloud.oracle.com/apm/synthetics/scripts/${this.getScriptId()}/domains/${this.getApmDomainId()}/compartments/${this.compartmentId}?region=${region}`;
        return url;
    }

    getChildren(_element: any): Thenable<RootNode[]> {
        return Promise.all(this.children);
    }
}

