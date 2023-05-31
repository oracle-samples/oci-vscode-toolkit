/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as dataScienceRequests                                                from "oci-datascience/lib/request";
import * as dataScienceModel                                                   from "oci-datascience/lib/model";
import * as types                                                              from "./types";
import { makeDataScienceClient, makeLoggingSearchClient } from "./clients";
import * as nls from 'vscode-nls';
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import { METRIC_FAILURE, METRIC_INVOCATION, METRIC_SUCCESS } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { MONITOR } from "../../common/monitor";
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function listProjects(compartmentId: string): Promise<types.IOCIResource[]> {
    const client = await makeDataScienceClient();
    return listItems({compartmentId}, request => client.listProjects(request as dataScienceRequests.ListProjectsRequest));
}

export async function listJobs(compartmentId: string, projectId: string): Promise<types.IOCIResource[]> {
    const client = await makeDataScienceClient();
    return listItems({
        compartmentId,
        projectId
    }, request => client.listJobs(request as dataScienceRequests.ListJobsRequest));
}

export async function listJobRuns(compartmentId: string, jobId: string): Promise<types.IOCIResource[]> {
    const client = await makeDataScienceClient();
    return listItems({
        compartmentId,
        jobId
    }, request => client.listJobRuns(request as dataScienceRequests.ListJobRunsRequest));
}

interface WithLifecycleState {
    lifecycleState: string
}

async function listItems(request: {},
                         listCall: ({}) => Promise<any>,
                         filter: (item: any) => boolean = item => (item as WithLifecycleState).lifecycleState !== 'DELETED')
    : Promise<types.IOCIResource[]> {
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'listItems', undefined));            
        const results: types.IOCIResource[] = [];

        let updatedRequest: any = request;

        let response;
        do {
            response = await listCall(updatedRequest);
            results.push(...response.items.filter(filter));
            updatedRequest.page = response.opcNextPage;
        } while (response.opcNextPage);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'listItems', undefined));      
        return results;
    } catch (exception) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'listItems', undefined, undefined, JSON.stringify(exception)));            
        const errorMsg = localize("listItemsErrorMsg","Unable to fetch items for: {0}, {1}",<string>request,JSON.stringify(exception));
        throw Error(errorMsg);
    }
}

export async function deleteJobRun(jobRunId: string): Promise<void> {
    const client = await makeDataScienceClient();
    await client.deleteJobRun({jobRunId});
}

export async function getProject(projectId: string): Promise<dataScienceModel.Project> {
    const client = await makeDataScienceClient();
    const projectRequest: dataScienceRequests.GetProjectRequest = { projectId: projectId! };
    return (await client.getProject(projectRequest)).project;
}

export async function getJob(jobId: string): Promise<dataScienceModel.Job> {
    const client = await makeDataScienceClient();
    const jobRequest: dataScienceRequests.GetJobRequest = {jobId: jobId!};
    return (await client.getJob(jobRequest)).job;
}

export async function getJobRun(jobRunId: string): Promise<dataScienceModel.JobRun> {
    const client = await makeDataScienceClient();
    const request: dataScienceRequests.GetJobRunRequest = {jobRunId};
    return (await client.getJobRun(request)).jobRun;
}

export async function cancelJobRun(jobRunId: string): Promise<void> {
    const client = await makeDataScienceClient();
    await client.cancelJobRun({jobRunId});
}

const defaultJobConfigurationOverrideDetails = {
    jobType: 'DEFAULT',
    environmentVariables: {},
    commandLineArguments: '',
    maximumRuntimeInMinutes: 5,
};

export async function runJob(job: any,
                             jobConfigurationOverrideDetails: dataScienceModel.DefaultJobConfigurationDetails = defaultJobConfigurationOverrideDetails): Promise<dataScienceModel.JobRun> {
    const request = {
        createJobRunDetails: {
            jobId: job.id,
            projectId: job.projectId,
            compartmentId: job.compartmentId,
            jobConfigurationOverrideDetails: jobConfigurationOverrideDetails,
        }
    };
    const client = await makeDataScienceClient();
    const response = await client.createJobRun(request);

    return response.jobRun;
}

export async function getJobRunLogs(run: dataScienceModel.JobRun) : Promise<string[]> {
    const client = await makeLoggingSearchClient();

    if (run.logDetails === undefined) {
        return [];
    }

    const searchLogsDetails = {
        timeStart: run.timeAccepted!,
        timeEnd: run.timeFinished!,
        searchQuery: `search "${run.compartmentId}/${run.logDetails!.logGroupId}/${run.logDetails!.logId}"`,
        isReturnFieldInfo: false
    };
    const response = await client.searchLogs({searchLogsDetails});

    return response.searchResponse.results!.map(result => result.data.logContent.data.message);
}

export async function deleteJob(jobId: string): Promise<void> {
    const client = await makeDataScienceClient();
    const request: dataScienceRequests.DeleteJobRequest = {
        jobId,
        deleteRelatedJobRuns: true,
    };

    await client.deleteJob(request);
}
