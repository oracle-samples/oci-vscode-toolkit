/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
  import { AuthenticationDetailsProvider } from 'oci-common';
 import * as resourceSearch from 'oci-resourcesearch';
 import { ext } from '../extension-vars';
 import * as identity from 'oci-identity';
 import {IOCICompartment} from '../userinterface/compartment';
 import {IOCIBasicResource} from '../userinterface/basic-resource';
 import { handleServiceError } from '../errorhandler/service-error-handler';
 import common = require("oci-common");
 import { GetCompartmentResponse, ListRegionSubscriptionsResponse } from 'oci-identity/lib/response';
 import * as nls from 'vscode-nls';
 
 const localize: nls.LocalizeFunc = nls.loadMessageBundle(); 

 const clientConfiguration = {
    retryConfiguration : {
      terminationStrategy: new common.MaxAttemptsTerminationStrategy(3),
      delayStrategy: new common.ExponentialBackoffDelayStrategy(30),
      retryCondition : (error) => { return error.statusCode == (409 || 429 || 500 || 502 || 503 || 504); }
    }
  };
  
 export async function getIdentityClient(
     profile: string,
 ): Promise<identity.IdentityClient> {
     return ext.api.getOCIAuthProvider(profile).then(
         (provider: AuthenticationDetailsProvider) =>
             new identity.IdentityClient({
                 authenticationDetailsProvider: provider,
             }, clientConfiguration),
     );
 }
 
 export async function getResourceSearchClient(
     profile: string,
 ): Promise<resourceSearch.ResourceSearchClient> {
     return ext.api.getOCIAuthProvider(profile).then(
         (provider) =>
             new resourceSearch.ResourceSearchClient({
                 authenticationDetailsProvider: provider,
             }, clientConfiguration),
     );
 }

export async function getTenancyName(id: string):Promise<string>{
    return (await ext.api.getCompartmentById(id)).compartment.name;
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
    const result: identity.models.Compartment[] = [];
    try{
        const request: identity.requests.ListCompartmentsRequest = {
            compartmentId: rootCompartmentId,
            accessLevel:
                identity.requests.ListCompartmentsRequest.AccessLevel.Accessible,
        };
    
        if (allCompartments) {
            request.compartmentIdInSubtree = true;
        }
    
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
 
    }
    catch (exception: any) {
        const getCompartmentsErrorMsg = localize("getCompartmentsErrorMsg", "Error in fetching compartments for root Id {0}.",rootCompartmentId);
        await handleServiceError(getCompartmentsErrorMsg, exception);
    }
    return result;
 }
 
 export async function getResources({
     profile,
     compartmentId,
 }: {
     profile: string;
     compartmentId: string;
 }): Promise<IOCIBasicResource[]> {
    let resources: any;
    try{
        const tenancyId = ext.api.getProfile(profile).getTenancy();
        const client = await getResourceSearchClient(profile);
    
        const structuredSearch: resourceSearch.models.StructuredSearchDetails = {
            query: `query all resources where compartmentId ='${compartmentId}'`,
            type: "Structured",
            matchingContextType: resourceSearch.models.SearchDetails.MatchingContextType.None
          };
        
        const searchRequest: resourceSearch.requests.SearchResourcesRequest = {
            searchDetails: structuredSearch,
            tenantId: tenancyId
          };
    
        const r = await client.searchResources(searchRequest);
        const items = r.resourceSummaryCollection.items;
        if (items === undefined) {
            return [];
        }
        resources = items;
    }
    catch (exception: any) {
        const getResourcesErrorMsg = localize("getResourcesErrorMsg", "Error in fetching resources for compartment {0}.", compartmentId);
        await handleServiceError(getResourcesErrorMsg, exception);
    }
    return resources;
 }

export async function getSubscribedRegions({
    profile
}: { 
    profile: string;
}): Promise<ListRegionSubscriptionsResponse> {
   let subscribedRegions;
   
   try {
       const client = await getIdentityClient(profile);
       const tenancyId = ext.api.getProfile(profile).getTenancy();

        // Create a request and dependent object(s).
       const listRegionSubscriptionsRequest: identity.requests.ListRegionSubscriptionsRequest = {
           tenancyId: tenancyId
       };
 
       // Send request to the Client.
       subscribedRegions = await client.listRegionSubscriptions(
           listRegionSubscriptionsRequest
       );
       
    } catch (exception: any) {
       const getSubscribedRegionsErrorMsg = localize("getSubscribedRegionsErrorMsg","Error in fetching subscribed regions ");
       await handleServiceError(getSubscribedRegionsErrorMsg,exception);
   }
   return subscribedRegions;
}

export async function getCompartmentById({
    profile,
    compartmentId,
}: { 
    profile: string;
    compartmentId: string;
}): Promise<GetCompartmentResponse>{
   let getCompartmentResponse;
   
   try {
       const client = await getIdentityClient(profile);

       // Create a request and dependent object(s).
       const getCompartmentRequest: identity.requests.GetCompartmentRequest = {
         compartmentId: compartmentId
       };
  
      // Send request to the Client.
      getCompartmentResponse = await client.getCompartment(getCompartmentRequest);
       
   } catch (exception: any) {
       const getCompartmentByIdErrorMsg = localize("getCompartmentByIdErrorMsg", "Error in getCompartment API for a given ocid {0}.", compartmentId);
       await handleServiceError(getCompartmentByIdErrorMsg, exception);
   }
   return getCompartmentResponse;
}

async function getCompartmentByName(
    compartmentName: string
): Promise<IOCICompartment | undefined>  {
    try {
        const rootCompartmentId = ext.api.getCurrentProfile().getTenancy();
        const profileName = ext.api.getCurrentProfile().getProfileName();

        const compartments = await getCompartments({
            profile: profileName,
            rootCompartmentId: rootCompartmentId,
            allCompartments: true,
        });

        for (const c of compartments) {
            if (c.name === compartmentName) {
                return c;
            }
        }
    } catch (exception: any) {
        const getCompartmentByNameErrorMsg = localize("getCompartmentByNameErrorMsg", "Error in getCompartment API for a given name {0}.", compartmentName);
        await handleServiceError(getCompartmentByNameErrorMsg, exception);
    }
}

export async function getCompartmentByIdOrName(
    compartmentInfo: string
): Promise<IOCICompartment | undefined> {
    try {
        let compartment: IOCICompartment | undefined;
        if (compartmentInfo) {
            const isOcid = compartmentInfo.includes("ocid") && compartmentInfo.includes("compartment.");
            if (isOcid) {
                const compartmentResponse = await getCompartmentById({
                    profile: ext.api.getCurrentProfile().getProfileName(),
                    compartmentId: compartmentInfo
                });
                if (compartmentResponse) {
                    compartment = compartmentResponse.compartment;
                }
            }
            else {
                compartment = await getCompartmentByName(compartmentInfo);
            }
        }
        return compartment;
    } catch (exception: any) {
        const getCompartmentByNameErrorMsg = localize("getCompartmentByIdOrNameErrorMsg", "Error in getCompartment API for a given ocid or name {0}.",compartmentInfo);
        await handleServiceError(getCompartmentByNameErrorMsg,exception);
    }
}

