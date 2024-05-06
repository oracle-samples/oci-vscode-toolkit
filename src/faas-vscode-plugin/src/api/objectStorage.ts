/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { clientConfiguration, getAuthProvider } from './common';
import { ObjectStorageClient } from 'oci-objectstorage';
import { GetNamespaceRequest } from 'oci-objectstorage/lib/request';

async function makeClient(profile: string): Promise<ObjectStorageClient> {
    return new ObjectStorageClient({
        authenticationDetailsProvider: await getAuthProvider(profile),
    }, clientConfiguration);
}

export async function getNamespaceForTenancy(profile: string, tenancyId: string): Promise<string> {
    return await getNamespace(profile, tenancyId);
}

export async function getNamespaceForUser(profile: string): Promise<string> {
    return await getNamespace(profile);
}

async function getNamespace(profile: string, tenancyId?: string): Promise<string> {
    const client = await makeClient(profile);
    const request: GetNamespaceRequest = {
        compartmentId: tenancyId
    };
    const response = await client.getNamespace(request);
    return response.value;
}
