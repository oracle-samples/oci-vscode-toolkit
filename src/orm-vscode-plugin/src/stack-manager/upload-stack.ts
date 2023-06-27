/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { CompartmentConfigSource, GitConfigSource, ObjectStorageConfigSource, UpdateZipUploadConfigSourceDetails, ZipUploadConfigSource } from "oci-resourcemanager/lib/model";
import { Stack } from "oci-resourcemanager/lib/model/stack";
import { StackSummary } from "oci-resourcemanager/lib/model/stack-summary";
import { GetStackResponse } from "oci-resourcemanager/lib/response/get-stack-response";
import { updateTfConfig } from "../api/objectstore-client";
import { getStack, updateStack } from "../api/orm-client";
import { ext } from "../extensionVars";
import { logger } from "../utils/get-logger";
import { ProgressLocation, window, } from 'vscode';
import { UpdateStackResponse } from "oci-resourcemanager/lib/response/update-stack-response";
import { getResourceManagerArtifactHook, getResourceManagerFolder } from "../common/fileSystem/local-terraform-config";
import { getTfConfigFiles, readFileAndEncodeContentBase64 } from "../common/fileSystem/file-system";
import { zip } from "../common/fileSystem/zip";
import path = require("path");
import * as nls from "vscode-nls";
import * as vscode from 'vscode';
import { METRIC_INVOCATION, METRIC_SUCCESS, METRIC_FAILURE } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import { MONITOR } from "../common/monitor";

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function updateStackDetails(stack: StackSummary){
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'updateStackDetails', undefined, stack.id));
        if(getResourceManagerArtifactHook().pathExists(stack.id!)) {
            const apiStackResponse: GetStackResponse = await getStack(stack.id!);
            await deployStack(apiStackResponse.stack);
        }
        else{
            let msg = localize('updateStackNotFoundPopupMsg', "Terraform configuration for this stack is not present locally. Please click on download configuration ");
            await window.showErrorMessage(msg, { modal: true });
        }
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'updateStackDetails', undefined, stack.id));
    } catch (error) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'updateStackDetails', undefined, stack.id, JSON.stringify(error)));
        logger().error(localize('updateStackErrorMsg', "Error in retrieving stack details for id {0}"), stack.id);
        throw error;
    }
}

export async function deployStack(stack: Stack) {
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'deployStack', undefined, stack.id));
        const configSource = stack.configSource?.configSourceType;
        if(GitConfigSource.configSourceType === configSource){
            const msg = localize('deployStackGitPopupMsg', 'Changes are not saved until committed to Git. Use the Git command line to commit these changes.');
            await window.showInformationMessage(msg, { modal: true });
        }
       else if(ObjectStorageConfigSource.configSourceType === configSource){
            let configSource = stack.configSource as ObjectStorageConfigSource;
            await window.withProgress<void>(
                {
                    location: ProgressLocation.Notification,
                    cancellable: false,
                },
            async (progress) => {
                    progress.report({ message: localize('deployStackObjStoreMsg', 'Uploading the Terraform configuration to the bucket in Object Storage…')  });
                    const files = await getTfConfigFiles(getResourceManagerFolder(stack.id!));
                    if(files.length !== 0){
                        for(let file of files){
                            await updateTfConfig(ext.api.getCurrentProfile().getProfileName(), configSource.namespace, configSource.bucketName, file); 
                        }
                    }
                },
            );
        }
       else if(ZipUploadConfigSource.configSourceType === configSource || CompartmentConfigSource.configSourceType === configSource){
            await zip(getResourceManagerFolder(stack.id!), stack.id!);
            const zipFilePath = path.join(getResourceManagerFolder(stack.id!), `${stack.id!}.zip`);
            const base64Zip = await readFileAndEncodeContentBase64(zipFilePath);
            const configSource = {
                zipFileBase64Encoded: base64Zip,
                workingDirectory: stack.configSource?.workingDirectory,
                configSourceType: ZipUploadConfigSource.configSourceType} as UpdateZipUploadConfigSourceDetails;
            await window.withProgress<UpdateStackResponse>(
                {
                    location: ProgressLocation.Notification,
                    cancellable: false,
                },
            async (progress) => {
                    progress.report({ message: localize('deployStackZipUploadMsg', 'Saving changes and uploading the Terraform configuration to the stack in Resource Manager…') });
                    return await updateStack(stack, configSource);
                },
            );
        }
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'deployStack', undefined, stack.id));
    } catch (error) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'deployStack', undefined, stack.id, JSON.stringify(error)));
        logger().error(localize('deployStackErrorMsg', 'Error in updating stack details for stack id {0}'), stack.id);
        throw error;
    }
}
