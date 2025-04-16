/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as identity from "oci-identity";
import { ext } from '../extensionVars';
import { IOCIUser } from '../resourceinterfaces/ioci-user';
import { IOCICompartment } from "../resourceinterfaces/ioci-compartment";
import { clientConfiguration, getAuthProvider } from "./common";

async function makeClient(profile: string): Promise<identity.IdentityClient> {
    return new identity.IdentityClient({
        authenticationDetailsProvider: await getAuthProvider(profile),
    }, clientConfiguration);
}

export async function getUsers(profile: string, compartmentId: string): Promise<IOCIUser[]> {
    const identityClient = await makeClient(profile);
    const request: identity.requests.ListUsersRequest = { compartmentId: compartmentId };
    const results: identity.models.User[] = [];
    let response;
    do {
        response = await identityClient.listUsers(request);
        results.push(...response.items);
        request.page = response.opcNextPage;
    } while (response.opcNextPage);
    return results;

}

// gets user information
// to be moved to toolkit
export async function getUserInfo(id: string, profile: string): Promise<IOCIUser> {

    const request: identity.requests.GetUserRequest = { userId: id };
    const client = await makeClient(profile);
    const result = (await client.getUser(request)).user;
    return { id: result.id!, name: result.name, isMfaActivated: result.isMfaActivated, description: result.description };

}

// gets all compartments under the provided rootCompartmentId.
// If rootCompartmentId is not provided, it uses the tenancy ID (root)
export async function getCompartments({
    profile,
    rootCompartmentId,
    allCompartments = false,
}: {
    profile: string;
    rootCompartmentId: string;
    configFilePath?: string;
    allCompartments?: boolean;
}): Promise<IOCICompartment[]> {

    const request: identity.requests.ListCompartmentsRequest = {
        compartmentId: rootCompartmentId,
        accessLevel:
            identity.requests.ListCompartmentsRequest.AccessLevel.Accessible,
    };

    if (allCompartments) {
        request.compartmentIdInSubtree = true;
    }

    const result: identity.models.Compartment[] = [];
    const client = await makeClient(profile);
    let compartmentsResponse;

    do {
        compartmentsResponse = await client.listCompartments(request);

        // Only get active compartments
        const filteredCompartments = compartmentsResponse.items.filter(
            (c) =>
                c.lifecycleState ===
                identity.models.Compartment.LifecycleState.Active,
        );
        result.push(...filteredCompartments);
        request.page = compartmentsResponse.opcNextPage;
    } while (compartmentsResponse.opcNextPage);
    return result;
}
