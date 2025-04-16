/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { IdentityClient } from "oci-identity/lib/client";
import { IOCICompartment } from "../resourceinterfaces/ioci-compartment";
import { ListCompartmentsRequest } from 'oci-identity/lib/request/list-compartments-request';
import { Compartment } from 'oci-identity/lib/model/compartment';
import { clientConfiguration, getAuthProvider } from "./client-configurations";
import { METRIC_INVOCATION, METRIC_SUCCESS, METRIC_FAILURE } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import { MONITOR } from "../common/monitor";

async function getIdentityClient(profile: string): Promise<IdentityClient> {
    return new IdentityClient({ authenticationDetailsProvider: await getAuthProvider(profile)}, clientConfiguration);
}

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
       const request: ListCompartmentsRequest = {
           compartmentId: rootCompartmentId,
           accessLevel:
               ListCompartmentsRequest.AccessLevel.Accessible,
       };
   
       if (allCompartments) {
           request.compartmentIdInSubtree = true;
       }
   
       const result: Compartment[] = [];
       const client = await getIdentityClient(profile);

       let compartmentsResponse;
   
       do {
           compartmentsResponse = await client.listCompartments(request);
           const filteredCompartments = compartmentsResponse.items.filter(
               (c) =>
                   c.lifecycleState ===
                   Compartment.LifecycleState.Active,
           );
           result.push(...filteredCompartments);
           request.page = compartmentsResponse.opcNextPage;
       } while (compartmentsResponse.opcNextPage);
       MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'getCompartments', rootCompartmentId));    
       return result;
   }
   catch(exception){
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'getCompartments', rootCompartmentId, undefined, JSON.stringify(exception)));    
       throw exception;
   }
}

