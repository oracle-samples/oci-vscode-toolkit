/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { getCompartmentIdsWithAncestorsExcludingRoot } from "oci-ide-plugin-base/dist/common/compartment/compartment-operations";
import { constructQuery } from 'oci-ide-plugin-base/dist/common/query/resource-based-query-maker';
import * as resourceSearch from 'oci-resourcesearch';
import { ResourceSummary } from "oci-resourcesearch/lib/model";
import * as nls from 'vscode-nls';
import { handleServiceError } from '../errorhandler/service-error-handler';
import { ext } from "../extension-vars";
import { IOCICompartment } from '../userinterface/compartment';
import { getCompartments, getResourceSearchClient } from './oci-sdk-client';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function getCompartmentsWithResourceTypes({
    resourceTypes,
    parentCompartmentId
}: {
    resourceTypes: string[],
    parentCompartmentId: string
}): Promise<IOCICompartment[]> {
    let resourceChildCompartments: IOCICompartment[] = [];
    try {
        const profileName = ext.api.getCurrentProfile().getProfileName();
        const childCompartments = await getCompartments({
            profile: profileName,
            rootCompartmentId: parentCompartmentId,
            allCompartments: false
        });
        if (!childCompartments) {return [];}
        if (!resourceTypes) {return childCompartments;}

        // Get compartments/subcompartments with resources under tenancy
        const resourceCompartmentsUnderTenancy: string[] = await getResourceCompartmentsUnderTenancy(profileName);
        for (const comp of childCompartments) {
            if (resourceCompartmentsUnderTenancy.includes(comp.id!)) {
                resourceChildCompartments.push(comp);
            }
        }
    }
    catch (exception: any) {
        const getCompartmentsWithResourceTypesErrorMsg = localize("getCompartmentsWithResourceTypesErrorMsg", "Error in  getCompartments API for given resource types ");
        handleServiceError(getCompartmentsWithResourceTypesErrorMsg, exception);
    }
    return resourceChildCompartments;

    async function getResourceCompartmentsUnderTenancy(profileName: string) {
        const tenancyId = ext.api.getProfile(profileName).getTenancy();
        const resources: ResourceSummary[] = await getResourcesUnderTenancy(resourceTypes);
        let resCompartmentIds = new Set<string>();
        for (const resItem of resources) {
            resCompartmentIds.add(resItem.compartmentId);
        }

        const allCompartmentsUnderTenancy = await getCompartments({
            profile: profileName,
            rootCompartmentId: tenancyId,
            allCompartments: true
        });
        let compartmentMap = new Map();
        for (const comp of allCompartmentsUnderTenancy) {
            compartmentMap.set(comp.id, comp);
        }

        const allResourceCompartments: string[] = getCompartmentIdsWithAncestorsExcludingRoot(resCompartmentIds, compartmentMap);
        return allResourceCompartments;
    }
}

async function getResourcesUnderTenancy(resourceTypes: string[], compartmentId?: string) {
    const client = await getSearchClient();
    let resourceQuery = constructQuery(resourceTypes);
    if (compartmentId) {
        resourceQuery += ` where compartmentId = '${compartmentId}'`;
    }
    const structuredSearch: resourceSearch.models.StructuredSearchDetails = {
        query: resourceQuery!,
        type: "Structured"
    };

    const searchRequest: resourceSearch.requests.SearchResourcesRequest = {
        searchDetails: structuredSearch,
        tenantId: getTenancyId()
    };

    const searchResponse = await client.searchResources(searchRequest);
    const items: ResourceSummary[] = searchResponse.resourceSummaryCollection.items ? searchResponse.resourceSummaryCollection.items : [];
    return items;
}

export async function isResourceFoundInCompartment(resourceTypes: string[], compartmentId: string) {
    if (resourceTypes.length === 0) {return false;}
    const items: ResourceSummary[] = await getResourcesUnderTenancy(resourceTypes, compartmentId);
    return items.length > 0;
}

async function getSearchClient() {
    const profileName = ext.api.getCurrentProfile().getProfileName();
    const client = await getResourceSearchClient(profileName);
    return client;
}

function getTenancyId() {
    return ext.api.getCurrentProfile().getTenancy();
}
