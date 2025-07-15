/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import { DataKeySummary, DataKeyTypes, LifecycleStates } from "oci-apmcontrolplane/lib/model";
import { clientConfiguration, getAuthProvider } from "./common";
//import { Monitor } from "oci-apmcontrolplane/lib/model/";
import { ApmDomainClient } from "oci-apmcontrolplane";
import { ListApmDomainsResponse, ListDataKeysResponse } from "oci-apmcontrolplane/lib/response";

async function makeClient(profile: string): Promise<ApmDomainClient> {
    return new ApmDomainClient({
        authenticationDetailsProvider: await getAuthProvider(profile),
    }, clientConfiguration);
}

export async function listDomains(
    compartmentId: string,
    profile: string
): Promise<ListApmDomainsResponse> {
    var client = await makeClient(profile);
    let domainList = await client.listApmDomains({ "compartmentId": compartmentId, "lifecycleState": LifecycleStates.Active });
    return domainList;
};

export async function getPrivateDataKey(
    apmDomainId: string,
    profile: string
): Promise<DataKeySummary[]> {
    var client = await makeClient(profile);
    let dataKey = await client.listDataKeys({ "apmDomainId": apmDomainId, "dataKeyType": DataKeyTypes.Private });
    return dataKey.items;
};
