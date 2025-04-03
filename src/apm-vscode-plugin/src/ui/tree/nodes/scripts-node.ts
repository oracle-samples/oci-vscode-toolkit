/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */


import { ScriptsItem } from '../../commands/resources';
import * as vscode from 'vscode';
import { getResourcePath } from '../../../utils/path-utils';
import { RootNode } from './rootNode';
import { listScripts } from '../../../api/apmsynthetics';
import { OCIApmSynScriptSummaryNode } from './oci-apm-syn-script-summary-node';

export class ScriptsNode extends RootNode {
    public compartmentId: string;
    public profileName: string;
    public apmDomainId: string;
    public outputChannel: vscode.OutputChannel;
    public children: (OCIApmSynScriptSummaryNode)[] = [];
    constructor(compartmentId: string, profileName: string, apmDomainId: string,
        parent: RootNode | undefined, outputChannel: vscode.OutputChannel) {
        super(
            `staticScriptNode-${apmDomainId}`,
            ScriptsItem.label,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/script-light.svg'),
            getResourcePath('dark/script-dark.svg'),
            ScriptsItem.commandName,
            [],
            ScriptsItem.context,
            [],
            parent,
            '',
            `Click to expand ${ScriptsItem.label}`
        );
        this.compartmentId = compartmentId;
        this.profileName = profileName;
        this.apmDomainId = apmDomainId;
        this.outputChannel = outputChannel;
    }

    getApmDomainId(): string {
        return this.apmDomainId!;
    }

    getChildren(_element: any): Thenable<RootNode[]> {
        this.children = [];
        return listScripts(this.apmDomainId, this.profileName,)
            .then((scripts) => {
                for (const scriptSummary of scripts) {
                    this.children.push(new OCIApmSynScriptSummaryNode(this.compartmentId, scriptSummary, this.apmDomainId, this.profileName, this.outputChannel, this));
                }
                return Promise.all(this.children);
            });
    }
}
