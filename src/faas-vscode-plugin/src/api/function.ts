/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */


import { FunctionsManagementClient, FunctionsInvokeClient } from "oci-functions";
import { FunctionSummary, ApplicationSummary, Application, UpdateFunctionDetails } from "oci-functions/lib/model";
import { ListFunctionsRequest, ListApplicationsRequest, UpdateFunctionRequest, CreateFunctionRequest } from "oci-functions/lib/request";
import { CreateFunctionResponse, DeleteFunctionResponse, InvokeFunctionResponse, ListApplicationsResponse, DeleteApplicationResponse } from "oci-functions/lib/response";
import * as common from "oci-common";

import * as types from "../api/types";
import { isEmpty } from "../utils/validators";
import { clientConfiguration, getAuthProvider } from "./common";

const maxWaitTimeInSeconds = 60;
const maxDelayTimeInSeconds = 10;

async function makeClient(profile: string): Promise<FunctionsManagementClient> {
    return new FunctionsManagementClient({
        authenticationDetailsProvider: await getAuthProvider(profile),
    }, clientConfiguration);
}

function getTags(): { [key: string]: string } {
    return {
        'created-by': 'oci-vscode-toolkit',
    };
}

/* Initialise Client here */
export async function getFunctionsInvokeClient(
    profile: string,
): Promise<FunctionsInvokeClient> {
    return new FunctionsInvokeClient(
        {
            authenticationDetailsProvider: await getAuthProvider(profile),
        },
        clientConfiguration
    );
}

export async function getApplication(
    profile: string,
    applicationId: string,
): Promise<types.IOCIApplication> {
    var client = await makeClient(profile);
    return client.getApplication({ applicationId }).then((app) => app.application);

}

// gets all functions belonging to the provided applicationId
export async function getFunctions(
    profile: string,
    applicationId: string,
): Promise<types.IOCIFunction[]> {

    const functionsClient = await makeClient(profile);
    const request: ListFunctionsRequest = {
        applicationId,
    };

    const results: FunctionSummary[] = [];
    let response;

    do {
        response = await functionsClient.listFunctions(request);
        results.push(...response.items);
        request.page = response.opcNextPage;
    } while (response.opcNextPage);
    return results;
}

export async function getFunction(
    profile: string,
    functionId: string,
): Promise<types.IOCIFunction> {
    var client = await makeClient(profile);
    return client.getFunction({ functionId }).then((f) => f.function);
}

/*
    updateFunctionSettings is for updating explicit settings of the function
    updateFunctionConfig for setting overrides
*/
export async function updateFunctionSettings(
    profile: string,
    functionId: string,
    memoryInMBs: number,
    timeoutInSeconds: number
): Promise<types.IOCIFunction> {

    const request: UpdateFunctionRequest = {
        functionId: functionId,
        updateFunctionDetails: {
            memoryInMBs: memoryInMBs,
            timeoutInSeconds: timeoutInSeconds
        }
    };
    var client = await makeClient(profile);
    return client.updateFunction(request).then((item) => item.function);
}

export async function updateFunctionConfig(
    profile: string,
    functionId: string,
    config: { [key: string]: string }

): Promise<types.IOCIFunction> {
    const updateFunctionDetails: UpdateFunctionDetails = {
        config,
    };
    const updateFunctionRequest: UpdateFunctionRequest = {
        functionId,
        updateFunctionDetails
    };
    var client = await makeClient(profile);
    return client.updateFunction(updateFunctionRequest).then((updateFunctionResponse) => updateFunctionResponse.function);
}

export async function createOCIFunction(
    profile: string,
    displayName: string,
    applicationId: string,
    image: string,
    memoryInMBs: number,
    timeoutInSeconds: number
): Promise<CreateFunctionResponse> {
    var client = await makeClient(profile);
    let response;
    let createFunctionReqObj: CreateFunctionRequest = {
        'createFunctionDetails': {
            displayName: displayName,
            applicationId: applicationId,
            image: image,
            memoryInMBs: memoryInMBs,
            timeoutInSeconds: timeoutInSeconds
        },
    };
    response = await client.createFunction(
        createFunctionReqObj
    );
    return response;

}

export async function deleteOCIFunction(functionID: string, profile: string): Promise<DeleteFunctionResponse> {
    var client = await makeClient(profile);
    return await client.deleteFunction({
        functionId: functionID
    });

}

export async function getApplications(profile: string, compartmentId: string): Promise<ApplicationSummary[]> {

    const client = await makeClient(profile);

    const request: ListApplicationsRequest = {
        compartmentId: compartmentId,
        limit: 50,
    };

    const results: ApplicationSummary[] = [];
    let searchResponse: ListApplicationsResponse;
    do {
        searchResponse = await client.listApplications(request);
        if (!searchResponse.items) {
            continue;
        }
        // Check if we want to show all the applications
        const activeItems = searchResponse.items.filter(
            (i) => i.lifecycleState === 'ACTIVE',
        );
        results.push(...activeItems);

        request.page = searchResponse.opcNextPage;
    } while (searchResponse.opcNextPage);

    return results.sort(sortOCIResource);
}

export function sortOCIResource(a: types.IOCIResource, b: types.IOCIResource): number {
    if (a.displayName && b.displayName) {
        return a.displayName.toLocaleLowerCase() >
            b.displayName.toLocaleLowerCase()
            ? 1
            : -1;
    }
    return 0;
}

export async function createOCIApplication(profileName: string, compartmentId: string,
    displayName: string, subnetIds: string[]): Promise<Application> {

    const functionsClient = await makeClient(profileName);

    const wait = functionsClient.createWaiters({
        terminationStrategy: new common.MaxTimeTerminationStrategy(maxWaitTimeInSeconds),
        delayStrategy: new common.ExponentialBackoffDelayStrategy(maxDelayTimeInSeconds),
    });

    const app = await functionsClient.createApplication({
        createApplicationDetails: {
            compartmentId,
            displayName,
            subnetIds,
            freeformTags: getTags(),
        },
    });

    const waitForStates = [Application.LifecycleState.Active];
    let resultApp = app.application;
    if (resultApp.id) {
        const r = await wait.forApplication(
            { applicationId: resultApp.id },
            ...waitForStates,
        );
        if (r) {
            resultApp = r?.application;
        }
    }
    return resultApp;
}

export async function deleteOCIApplication(applicationID: string, profile: string): Promise<DeleteApplicationResponse> {
    var client = await makeClient(profile);
    return await client.deleteApplication({
        applicationId: applicationID
    });

}

export async function invokeFunction(
    profileName: string,
    functionID: string
): Promise<InvokeFunctionResponse> {
    let invokeFunctionClient = await getFunctionsInvokeClient(profileName);

    // Since the FunctionsInvokeClient returns an empty endpoint (known defect in typescript-sdk), the invoke-endpoint is grabbed from IOCIFunction.
    if (isEmpty(invokeFunctionClient.endpoint)) {
        invokeFunctionClient.endpoint = (
            await getFunction(profileName, functionID)
        ).invokeEndpoint!;
    }
    return invokeFunctionClient.invokeFunction({ functionId: functionID });
}
