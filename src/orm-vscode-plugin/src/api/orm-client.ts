/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { METRIC_INVOCATION, METRIC_SUCCESS, METRIC_FAILURE } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import * as resourcemanager from "oci-resourcemanager";
import { MONITOR } from "../common/monitor";
import { IOCIProfile } from '../oci-api';
import { clientConfiguration, getAuthProvider } from './client-configurations';
import { ext } from '../extensionVars';
let client: resourcemanager.ResourceManagerClient;
const PHX_DEV_ENDPOINT_OVERRIDE = "https://resourcemanager-dev.us-phoenix-1.oci.oracleiaas.com";
const PHX_UNSTABLE_DEV_ENDPOINT_OVERRIDE ="https://resourcemanager-unstable-dev.us-phoenix-1.oci.oraclecloud.com";

export async function initializeRMSClient(profile: IOCIProfile) {
    const tenancyId = profile.getTenancy();
    client = new resourcemanager.ResourceManagerClient(
        { authenticationDetailsProvider: await getAuthProvider(profile.getProfileName())}, 
        clientConfiguration);
    setEndpointForRMSClient(tenancyId);
}

function setEndpointForRMSClient(tenancyId: string) {
    if (tenancyId === "ocid1.tenancy.oc1..aaaaaaaap7abegsk7kv7a77xyaq725llxuweymwjvyrsnzz4efj5tondu3la") {
        client.endpoint = PHX_DEV_ENDPOINT_OVERRIDE;
    } else if (tenancyId === "ocid1.tenancy.oc1..aaaaaaaavp2u43uv5wp7midlasabto6xmi2mxvgpxjkb3qeuywagewwh5i5q") {
        client.endpoint = PHX_UNSTABLE_DEV_ENDPOINT_OVERRIDE;
    }
    
}

function setClientRegion() {
    if (ext.api.getRegion() !== undefined) {
        client.regionId = ext.api.getRegion();
    }
}

export async function listStacks({
    compartmentId,
}: { 
    compartmentId: string;
}): Promise<resourcemanager.models.StackSummary[]>{
   
   let listStacksResponse;
   const results: resourcemanager.models.StackSummary[] = [];

   try {
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'listStacks', compartmentId));
    const listStacksRequest: resourcemanager.requests.ListStacksRequest = {
        compartmentId: compartmentId,
        sortBy: resourcemanager.requests.ListStacksRequest.SortBy.Displayname,
        sortOrder: resourcemanager.requests.ListStacksRequest.SortOrder.Asc
    };
    setClientRegion();
    do {
    listStacksResponse = await client.listStacks(listStacksRequest);
        if (!listStacksResponse.items) {
            continue;
        }
        const activeItems = listStacksResponse.items.filter(
            (i) => i.lifecycleState === 'ACTIVE',
        );
        results.push(...activeItems);

        listStacksRequest.page = listStacksResponse.opcNextPage;
    } while (listStacksResponse.opcNextPage);
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'listStacks', compartmentId));
    return results;
    
   } catch (exception) {
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'listStacks', compartmentId, undefined, JSON.stringify(exception)));
       throw exception;
   }
}


export async function getStack(stackId: string): Promise<resourcemanager.responses.GetStackResponse>{
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'getStack', undefined, stackId));
        setClientRegion();
        const getStackRequest: resourcemanager.requests.GetStackRequest = {
            stackId: stackId
          };
          let stack = await client.getStack(getStackRequest);
          MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'getStack', undefined, stackId));
          return stack;
    } catch (exception) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'getStack', undefined, stackId, JSON.stringify(exception)));
        throw exception;
    }    
} 

export async function getStackTfConfig(stackId: string): Promise<resourcemanager.responses.GetStackTfConfigResponse>{
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'getStackTfConfig', undefined, stackId));
        setClientRegion();
        
        const getStackTfConfigRequest: resourcemanager.requests.GetStackTfConfigRequest = {
            stackId: stackId
        };
        
        let stackConfig =  await client.getStackTfConfig(getStackTfConfigRequest);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'getStackTfConfig', undefined, stackId));
        return stackConfig;
    } catch (exception) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'getStackTfConfig', undefined, stackId, JSON.stringify(exception)));
        throw exception;
    }
}

export async function updateStack(stack: resourcemanager.models.Stack, configType: resourcemanager.models.UpdateConfigSourceDetails) : Promise<resourcemanager.responses.UpdateStackResponse>{
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'updateStack', undefined, stack.id));
        setClientRegion();
        const updateStackDetails = {
            displayName: stack.displayName,
            description: stack.description,
            configSource: configType,
            terraformVersion: stack.terraformVersion,
            freeformTags: stack.freeformTags,
            definedTags: stack.definedTags
        };
  
        const updateStackRequest: resourcemanager.requests.UpdateStackRequest = {
            stackId: stack.id!,
            updateStackDetails: updateStackDetails,
        };
        let updateStackResponse = await client.updateStack(updateStackRequest);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'updateStack', undefined, stack.id));
        return updateStackResponse;
    } catch (exception) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'updateStack', undefined, stack.id, JSON.stringify(exception)));
        throw exception;
    }
}

export async function createJob(jobDetails: resourcemanager.models.CreateJobDetails) : Promise<resourcemanager.responses.CreateJobResponse>{
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'createJob', undefined, jobDetails.stackId));
        setClientRegion(); 
         const createJobRequest: resourcemanager.requests.CreateJobRequest = {
            createJobDetails: jobDetails
         };
        let createJobResponse = await client.createJob(createJobRequest);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'createJob', undefined, jobDetails.stackId));
        return createJobResponse;
    } catch (exception) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'createJob', undefined, jobDetails.stackId, JSON.stringify(exception)));
        throw exception;
    }
}

export async function listJobs(compartmentId: string, stackId: string) : Promise<resourcemanager.models.JobSummary[]>{
    let listJobsResponse; 
    const results: resourcemanager.models.JobSummary[] = [];
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'listJobs', compartmentId, stackId));
        setClientRegion(); 
         const listJobsRequest: resourcemanager.requests.ListJobsRequest = {
            compartmentId: compartmentId,
            stackId: stackId,
            sortBy: resourcemanager.requests.ListJobsRequest.SortBy.Timecreated,
            sortOrder: resourcemanager.requests.ListJobsRequest.SortOrder.Desc,
          };

          do {
            listJobsResponse = await client.listJobs(listJobsRequest);
            if (!listJobsResponse.items) {
                continue;
            }
            results.push(...listJobsResponse.items);
    
            listJobsRequest.page = listJobsResponse.opcNextPage;
        } while (listJobsResponse.opcNextPage);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'listJobs', compartmentId, stackId));
      return results;
    } catch (exception) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'listJobs', compartmentId, stackId, JSON.stringify(exception)));
        throw exception;
    }
}

export async function getJobDetails(jobId: string) : Promise<resourcemanager.responses.GetJobResponse>{
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'getJobDetails', undefined, jobId));
        setClientRegion();  
         const getJobRequest: resourcemanager.requests.GetJobRequest = {
                jobId: jobId
         };         
         let jobDetail =  await client.getJob(getJobRequest);
         MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'getJobDetails', undefined, jobId));
         return jobDetail;
    } catch (exception) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'getJobDetails', undefined, jobId));
        throw exception;
    }
}

export async function fetchJobLogs(jobId: string, limit: number) : Promise<resourcemanager.models.LogEntry[]>{
    let fetchJobLogsResponse; 
    const results: resourcemanager.models.LogEntry[] = [];
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'fetchJobLogs', undefined, jobId));
        setClientRegion();
        const getJobLogsRequest: resourcemanager.requests.GetJobLogsRequest = {
            jobId: jobId,
            limit: limit
        };

        do {
            fetchJobLogsResponse = await client.getJobLogs(getJobLogsRequest);
            if (!fetchJobLogsResponse.items) {
                continue;
            }
            results.push(...fetchJobLogsResponse.items);
    
            getJobLogsRequest.page = fetchJobLogsResponse.opcNextPage;
        } while (fetchJobLogsResponse.opcNextPage);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'fetchJobLogs', undefined, jobId));
      return results;
    } catch (exception) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'fetchJobLogs', undefined, jobId, JSON.stringify(exception)));
        throw exception;
    }
}
