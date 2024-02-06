/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as identity     from  "oci-identity";
import { ext }           from '../../extensionVars';
import {IOCICompartment} from "./resourceinterfaces/ioci-compartment";
import { logger }        from "../../ui/vscode_ext";
import * as nls from 'vscode-nls';
import { METRIC_FAILURE, METRIC_INVOCATION, METRIC_SUCCESS } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { MONITOR } from "../../common/monitor";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

/* Initialise Client here */
/* Replace the Client you want to use with IdentityClient in the API call. List of client can be found at  https://github.com/oracle/oci-typescript-sdk/tree/master/lib */
 async function getIdentityClient(
     profile: string,
 ): Promise<identity.IdentityClient> {
     return ext.api.getOCIAuthProvider(profile).then(
         (provider) =>
             new identity.IdentityClient({
                 authenticationDetailsProvider: provider,
             }),
     );
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
    try{
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'getCompartments', rootCompartmentId));          
        const request: identity.requests.ListCompartmentsRequest = {
            compartmentId: rootCompartmentId,
            accessLevel:
                identity.requests.ListCompartmentsRequest.AccessLevel.Accessible,
        };

        if (allCompartments) {
            request.compartmentIdInSubtree = true;
        }

        const result: identity.models.Compartment[] = [];
        const client = await getIdentityClient(profile);
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
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'getCompartments', rootCompartmentId));          
        return result;
    }
    catch(exception){
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'getCompartments', rootCompartmentId, undefined, JSON.stringify(exception)));            
        const errorMsg = localize("getCompartmentsErrorMsg","Error in fetching compartments for root Id ");
        logger().error(errorMsg, rootCompartmentId, JSON.stringify(exception));
        throw exception;
    }
}
