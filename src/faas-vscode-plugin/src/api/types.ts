/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

export interface IOCIResource {
    id?: string;
    identifier?: string;
    displayName?: string;
    name?: string;
    compartmentId?: string;
    compartmentName?: string;
    definedTags?: {
        [key: string]: {
            [key: string]: any;
        };
    };
    freeformTags?: { [key: string]: string };
    timeCreated?: Date;
    timeUpdated?: Date;
    lifecycleState?: string;
}

export interface IOCIApplication extends IOCIConfigurableResource {
    subnetIds?: Array<string>;
}

// Represents a resource that has a config key
export interface IOCIConfigurableResource extends IOCIResource {
    config?: { [key: string]: string };
}

export interface IOCIFunction extends IOCIResource, IOCIConfigurableResource {
    applicationId?: string;
    image?: string;
    imageDigest?: string;
    memoryInMBs?: number;
    timeoutInSeconds?: number;
    invokeEndpoint?: string;
    version?: string;
    type?: string;
}

export interface IOCISubnet extends IOCIResource {
    // the subnet is regional if availabilityDomain == null
    availabilityDomain?: string;
    // if set to true, it's a private subnet
    prohibitPublicIpOnVnic?: boolean;
    cidrBlock: string;
    routeTableId: string;
    virtualRouterIp: string;
    vcnId: string;
    virtualRouterMac: string;
}
