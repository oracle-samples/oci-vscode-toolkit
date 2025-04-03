/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as resourceSearch from 'oci-resourcesearch';
import { ext } from '../extensionVars';
import { IOCIBasicResource } from '../oci-api';

export async function getResourceSearchClient(
    profile: string,
): Promise<resourceSearch.ResourceSearchClient> {
    return ext.api.getOCIAuthProvider(profile).then(
        (provider) =>
            new resourceSearch.ResourceSearchClient({
                authenticationDetailsProvider: provider,
            }),
    );
}

export async function getResources({
    profile,
    compartmentId,
}: {
    profile: string;
    compartmentId: string;
}): Promise<IOCIBasicResource[]> {
    const tenancyId = ext.api.getProfile(profile).getTenancy();
    const client = await getResourceSearchClient(profile);

    const structuredSearch: resourceSearch.models.StructuredSearchDetails = {
        query: `query all resources where compartmentId ='${compartmentId}'`,
        type: "Structured",
        matchingContextType: resourceSearch.models.SearchDetails.MatchingContextType.None
      };
    
    const searchRequest: resourceSearch.requests.SearchResourcesRequest = {
        searchDetails: structuredSearch,
        limit: 1000,
        tenantId: tenancyId
      };

    const r = await client.searchResources(searchRequest);
    const items = r.resourceSummaryCollection.items;
    if (items === undefined) {
        return [];
    }
    return items;
}
