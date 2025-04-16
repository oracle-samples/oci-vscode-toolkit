/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as core from 'oci-core';
import * as types from './types';
import { ext } from '../extensionVars';
import { clientConfiguration } from './common';

async function getVirtualNetworkClient(
    profile: string,
): Promise<core.VirtualNetworkClient> {
    return ext.api.getOCIAuthProvider(profile).then(
        (provider) =>
            new core.VirtualNetworkClient({
                authenticationDetailsProvider: provider,
            }, clientConfiguration),
    );
}

export async function getVCNs(
    profile: string,
    compartmentId: string,
): Promise<types.IOCIResource[]> {
    const vcnClient = await getVirtualNetworkClient(profile);
    const request: core.requests.ListVcnsRequest = {
        compartmentId,
    };

    const results: core.models.Vcn[] = [];
    let vcnResponse;

    do {
        vcnResponse = await vcnClient.listVcns(request);
        results.push(...vcnResponse.items);
        request.page = vcnResponse.opcNextPage;
    } while (vcnResponse.opcNextPage);

    return results;
}

export async function getSubnets(
    profile: string,
    compartmentId: string,
    vcnId: string,
): Promise<types.IOCISubnet[]> {
    const vcnClient = await getVirtualNetworkClient(profile);
    const request: core.requests.ListSubnetsRequest = {
        compartmentId,
        vcnId,
    };

    const results: core.models.Subnet[] = [];
    let subnetsResponse;

    do {
        subnetsResponse = await vcnClient.listSubnets(request);
        results.push(...subnetsResponse.items);
        request.page = subnetsResponse.opcNextPage;
    } while (subnetsResponse.opcNextPage);

    return results;
}
