/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { CreateJobResponse } from "oci-resourcemanager/lib/response/create-job-response";
import { createJob, fetchJobLogs, getJobDetails } from "../api/orm-client";
import { ext } from "../extensionVars";
import { commands, ProgressLocation, window } from 'vscode';
import * as resourcemanager from "oci-resourcemanager";
import { pollingOptions, terraformAdvancedOptions } from "../api/client-configurations";
import { OCIStackNode } from "../tree/nodes/oci-stack-node";
import { logger } from "../utils/get-logger";
import { JobRunLifecycleStateProperties } from "../tree/nodes/logic/job-run-lifecycle-state-properties";
import { createFullCommandName } from "../commands/resources";
import * as nls from "vscode-nls";
import { METRIC_INVOCATION, METRIC_SUCCESS, METRIC_FAILURE } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import { MONITOR } from "../common/monitor";

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function planStack(node: OCIStackNode): Promise<CreateJobResponse> {
  try {
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'planStack',undefined, node.id));        
    return await window.withProgress<CreateJobResponse>(
      {
          location: ProgressLocation.Notification,
          cancellable: false,
      },
    async (progress) => {
          progress.report({ message: localize('planStackPopupMsg', 'Running the Plan action on the stack in Resource Manager…') });
          let jobDetails = {
            stackId: node.resource.id!,
            displayName: node.resource.displayName,
            operation: resourcemanager.models.Job.Operation.Plan,
            jobOperationDetails: {
              operation: resourcemanager.models.Job.Operation.Plan,
              terraformAdvancedOptions: terraformAdvancedOptions
            }
          };
          let newJob = await createJob(jobDetails);
          MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'planStack',undefined, node.id));        
          return newJob;
      },
    );    
  } catch (error) {
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'planStack',undefined, node.resource.id));        
    logger().error(localize('planStackErrorMsg', 'Error in planning terraform config for stack {0}'), node.resource.id);
    throw error;
  }
}

export async function applyStack(node: OCIStackNode) : Promise<CreateJobResponse> {
  try {
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'applyStack',undefined, node.id));        
    return await window.withProgress<CreateJobResponse>(
      {
          location: ProgressLocation.Notification,
          cancellable: false,
      },
    async (progress) => {
          progress.report({ message: localize('applyStackPopupMsg', 'Running the Apply action on the stack in Resource Manager…') });
          let jobDetails = {
            stackId: node.resource.id!,
            displayName: node.resource.displayName,
            operation: resourcemanager.models.Job.Operation.Apply,
            jobOperationDetails: {
              operation: resourcemanager.models.Job.Operation.Apply,
              terraformAdvancedOptions: terraformAdvancedOptions,
              executionPlanStrategy:
              resourcemanager.models.ApplyJobOperationDetails.ExecutionPlanStrategy.AutoApproved
            }
          };
          let newJob = await createJob(jobDetails);
          MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'applyStack',undefined, node.id));        
          return newJob;
      },
    );
  } catch (error) {
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'applyStack',undefined, node.resource.id));        
      logger().error(localize('applyStackErrorMsg', 'Error in applying terraform config for stack {0}'), node.resource.id);
      throw error;
  }
} 

export async function displayLogsAndUpdateStatus(node: OCIStackNode, response: CreateJobResponse, limit: number){
  try {
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'displayLogsAndUpdateStatus', undefined, node.id));
    logger().info(response.job.operation!, localize('displayLogsInprogressMsg', 'is in progress...'));
    let startTime = response.job.timeCreated!;
    let endTime = new Date().toISOString() as unknown as Date;

    const poll = (api: any, isJobDone: any, interval: number, maxAttempts: number) => {
      let attempts = 0;

      const executePoll = async (resolve: any, reject: any) => {
        const result = await api();
        attempts++;

        if (isJobDone(result.job.lifecycleState)) {
            return resolve(result);
        } else if (maxAttempts && attempts === maxAttempts) {          
          logger().info(localize('maxPollingAttemptMsg', 'Job took long time to complete & maximum polling attempts are met. Please refer to Console for logs..'));
            return reject(new Error(localize('maxPollingAttemptErrorMsg', 'Exceeded maximum polling attempts')));
        } else {
            await getJobLogsAndPrint(response, limit);
            startTime = endTime;
            endTime = new Date().toISOString() as unknown as Date;
            setTimeout(executePoll, interval, resolve, reject);
        }
      };
      return new Promise(executePoll);
    };

    let jobDetails = () => getJobDetails(response.job.id!);
      await poll(jobDetails, JobRunLifecycleStateProperties.jobIsDone, pollingOptions.pollInterval, pollingOptions.maxPollAttempts)
      .then(async result => { 
        const response = result as any;
        await getJobLogsAndPrint(response, limit);
        logger().info(`${response.job.operation} ${response.job.lifecycleState}`);
        await updateNodeStatus(node, response);
      });      
      MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'displayLogsAndUpdateStatus', undefined, response.job.id));
  } catch (error) {
      MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'displayLogsAndUpdateStatus', undefined, response.job.id, JSON.stringify(error)));
      logger().error(localize('jobLogsAndPrintErrorMsg', 'Error in polling logs for a given job {0}'), response.job.id!);
      throw error;
  }
}

async function getJobLogsAndPrint(response: any, limit: any){
  const jobLogsResponse = await fetchJobLogs( 
  response.job.id!, limit);
  jobLogsResponse.forEach(log => { logger().info(log.message!);});
}

async function updateNodeStatus(node: OCIStackNode, response: any){
  node.lightIcon = JobRunLifecycleStateProperties.getIconPath(response.job.lifecycleState!, 'light');
  node.darkIcon = JobRunLifecycleStateProperties.getIconPath(response.job.lifecycleState!, 'dark');
  node.tooltip = `${JobRunLifecycleStateProperties.getTooltip(response.job.operation!, response.job.lifecycleState!)}`;
  await commands.executeCommand(createFullCommandName("refreshTree"), node);
}

  
