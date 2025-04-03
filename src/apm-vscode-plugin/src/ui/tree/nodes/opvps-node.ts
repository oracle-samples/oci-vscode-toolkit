/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */


import { OnPremiseVantagePointsItem } from '../../commands/resources';
import * as vscode from 'vscode';
import { getResourcePath } from '../../../utils/path-utils';
import { RootNode } from './rootNode';
import { ListOnPremiseVantagePoints } from '../../../api/apmsynthetics';
import { OCIApmOpvpNode } from './oci-apmSynOpvp-node';

export class OnPremiseVantagePointsNode extends RootNode {
    public compartmentId: string;
    public profileName: string;
    public apmDomainId: string;
    public outputChannel: vscode.OutputChannel;
    public children: (OCIApmOpvpNode)[] = [];
    constructor(compartmentId: string, profileName: string, apmDomainId: string, outputChannel: vscode.OutputChannel) {
        super(
            `staticOnPremiseVantagePointNode-${apmDomainId}`,
            OnPremiseVantagePointsItem.label,
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/opvp-light.svg'),
            getResourcePath('dark/opvp-dark.svg'),
            OnPremiseVantagePointsItem.commandName,
            [],
            OnPremiseVantagePointsItem.context,
            [],
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
        return ListOnPremiseVantagePoints(this.apmDomainId, this.profileName,)
            .then((onPremiseVantagePoints) => {
                for (const onPremiseVantagePointSummary of onPremiseVantagePoints) {
                    this.children.push(new OCIApmOpvpNode(this.compartmentId,
                        this.apmDomainId, onPremiseVantagePointSummary, this.profileName,
                        this, this.outputChannel)
                    );
                }
                return Promise.all(this.children);
            });
    }
}
