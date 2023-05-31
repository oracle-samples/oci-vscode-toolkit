/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

 export interface IBasicResourceNodeInfo {
    lightIcon: string;
    // dark icon shows up in the dark mode
    darkIcon: string;
    // Used in UI
    name: string;
    // Name in singular (e.g. Load Balancer instead of Load Balancers)
    nameSingular: string;
    id: string;
}

// Resource names come from here: https://docs.cloud.oracle.com/en-us/iaas/Content/Search/Concepts/queryoverview.htm#Resources
export const ResourceIconMapping: IBasicResourceNodeInfo[] = [
    {
        lightIcon: 'apigateway-light.svg',
        darkIcon: 'apigateway-dark.svg',
        name: 'API Gateways',
        nameSingular: 'API Gateway',
        id: 'apigateway',
    },
    {
        lightIcon: 'autonomousdb-light.svg',
        darkIcon: 'autonomousdb-dark.svg',
        name: 'Autonomous Databases',
        nameSingular: 'Autonomous Database',
        id: 'autonomousdatabase',
    },
    {
        lightIcon: 'bucket-light.svg',
        darkIcon: 'bucket-dark.svg',
        name: 'Buckets',
        nameSingular: 'Bucket',
        id: 'bucket',
    },
    {
        lightIcon: 'function-light.svg',
        darkIcon: 'function-dark.svg',
        name: 'Functions',
        nameSingular: 'Function',
        id: 'functionsfunction',
    },
    {
        lightIcon: 'instance-light.svg',
        darkIcon: 'instance-dark.svg',
        name: 'Compute Instances',
        nameSingular: 'Compute Instance',
        id: 'instance',
    },
    {
        lightIcon: 'lb-light.svg',
        darkIcon: 'lb-dark.svg',
        name: 'Load Balancers',
        nameSingular: 'Load Balancer',
        id: 'loadbalancer',
    },
    {
        lightIcon: 'vcn-light.svg',
        darkIcon: 'vcn-dark.svg',
        name: 'Virtual Cloud Networks (VCN)',
        nameSingular: 'VCN',
        id: 'vcn',
    },
    {
        lightIcon: 'stream-light.svg',
        darkIcon: 'stream-dark.svg',
        name: 'Streams',
        nameSingular: 'Stream',
        id: 'stream',
    },
    {
        lightIcon: 'resource-manager-light.svg',
        darkIcon: 'resource-manager-dark.svg',
        name: 'ORM Stacks',
        nameSingular: 'ORM Stack',
        id: 'ormstack',
    },
    {
        lightIcon: 'email-sender-light.svg',
        darkIcon: 'email-sender-dark.svg',
        name: 'Email Senders',
        nameSingular: 'Email Sender',
        id: 'emailsender',
    },
    {
        lightIcon: 'fs-light.svg',
        darkIcon: 'fs-dark.svg',
        name: 'File Systems',
        nameSingular: 'File System',
        id: 'filesystem',
    },
    {
        // TODO: Need mysql icons (if they exist)
        lightIcon: 'autonomousdb-light.svg',
        darkIcon: 'autonomousdb-dark.svg',
        name: 'MySQL Databases',
        nameSingular: 'MySQL Database',
        id: 'dbsystem',
    },
];
