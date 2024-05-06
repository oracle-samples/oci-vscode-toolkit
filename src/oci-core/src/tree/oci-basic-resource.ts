/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import { BaseNode } from '../userinterface/base-node';
import { getResourcePath } from '../util/path-utils';
import { resourceNodeCommand } from '../util/resources';
import { getResources } from '../api/oci-sdk-client';
import { IBasicResourceNodeInfo, ResourceIconMapping } from '../userinterface/resource-mapping';
import assert from '../util/assert';
import { IOCIResourceNode } from '../userinterface/oci-compartment-node';
import {IRootNode} from '../userinterface/root-node';
import {IOCIBasicResource} from '../userinterface/basic-resource';
import { ext } from '../extension-vars';
import { RootNode } from '../userinterface/oci-root-node';

// This node is used to represents every resource in OCI
export class OCIBasicResource extends BaseNode
    implements IRootNode, IOCIResourceNode {
    public resource: IOCIBasicResource;

    constructor(
        resource: IOCIBasicResource,
        parent: RootNode | undefined,
        label: string,
        description: string,
        tooltip: string,
        lightIcon: string,
        darkIcon: string,
    ) {
        super(
            resource.identifier,
            label,
            vscode.TreeItemCollapsibleState.None,
            getResourcePath(lightIcon),
            getResourcePath(darkIcon),
            resourceNodeCommand,
            [resource],
            'OCIResourceNode',
            [],
            parent,
            description,
            tooltip,
        );
        this.resource = resource;
    }

    getResource(): IOCIBasicResource {
        return this.resource;
    }

    getResourceId(): string {
        return this.resource.identifier;
    }

    // Gets the full Console URL to the resource
    async getConsoleUrl(region: string): Promise<string> {
        const consoleUrl = await ext.api.getConsoleUrl(region);

        switch (this.resource.resourceType.toLowerCase()) {
            case 'apigateway': {
                return `${consoleUrl}/api-gateway/gateways/${this.resource.identifier}`;
            }
            case 'autonomousdatabase': {
                return `${consoleUrl}/db/adb/${this.resource.identifier}`;
            }
            case 'bucket': {
                // TODO: not sure how to get the namespace name ....
                // https://console.us-ashburn-1.oraclecloud.com/object-storage/buckets/[NAMESPACE]/[BUCKETNAME]/objects
                return `${consoleUrl}/object-storage/buckets`;
            }
            case 'functionsfunction': {
                // TODO: we don't know the app id at this point ...
                // https://console.us-ashburn-1.oraclecloud.com/functions/apps/ocid1.fnapp.ID/fns/ocid1.fnfunc.oc1.ID/metrics
                return `${consoleUrl}/functions/apps`;
            }

            case 'instance': {
                return `${consoleUrl}/compute/instances/${this.resource.identifier}`;
            }

            case 'loadbalancer': {
                return `${consoleUrl}/load-balancer/load-balancers/${this.resource.identifier}`;
            }

            case 'vcn': {
                return `${consoleUrl}/networking/vcns/${this.resource.identifier}`;
            }

            case 'stream': {
                return `${consoleUrl}/storage/streaming/${this.resource.identifier}`;
            }

            case 'ormstack': {
                return `${consoleUrl}/resourcemanager/stacks/${this.resource.identifier}`;
            }

            case 'emailsender': {
                return `${consoleUrl}/messaging/email/senders/${this.resource.identifier}`;
            }

            case 'filesystem': {
                return `${consoleUrl}/fss/file-systems/${this.resource.identifier}`;
            }

            default: {
                return consoleUrl;
            }
        }
    }
}

export async function createBasicResources(
    profileName: string,
    parent: IRootNode,
    compartmentId: string,
): Promise<OCIBasicResource[]> {
    const results: OCIBasicResource[] = [];

    const res = await getResources({
        profile: profileName,
        compartmentId,
    });

    for (const r of res) {
        const n = createBasicResourceNode(r, parent);
        if (n) {
            results.push(n);
        }
    }
    return results.sort((a, b) =>
        a.resource.resourceType > b.resource.resourceType ? 1 : -1,
    );
}

// returns the array of resources user selected
function getResourceFilter(): string[] {
    const selected:
        | string[]
        | undefined = vscode.workspace
        .getConfiguration()
        .get<string[]>('oci.resourceFilter');
    assert(selected);
    return selected;
}

function createBasicResourceNode(
    resource: IOCIBasicResource,
    parent: IRootNode,
): OCIBasicResource | undefined {
    const filtered = getResourceFilter();
    // Check if the resource is in the filter
    // if not, we can return undefined
    const filter: string | undefined = filtered.find(
        (i) => i === resource.resourceType.toLowerCase(),
    );
    if (!filter) {
        return undefined;
    }

    const resInfo: IBasicResourceNodeInfo | undefined = ResourceIconMapping.find(
        (i) => i.id === resource.resourceType.toLowerCase(),
    );

    if (resInfo) {
        return new OCIBasicResource(
            resource,
            parent,
            resource.displayName || '(UNKNOWN)',
            resInfo.nameSingular,
            resource.identifier,
            resInfo.lightIcon,
            resInfo.darkIcon,
        );
    }
    return undefined;
}
