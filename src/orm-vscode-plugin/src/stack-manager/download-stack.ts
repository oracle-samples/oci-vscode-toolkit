/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { getStackTfConfig } from "../api/orm-client";
import { getAllObjectsFromBucket, getTfConfigFromBucket } from "../api/objectstore-client";
import { logger } from "../utils/get-logger";
import { commands, extensions, FileType, Uri } from "vscode";
import { CompartmentConfigSource, GitConfigSource, ObjectStorageConfigSource, ZipUploadConfigSource } from "oci-resourcemanager/lib/model";
import { ext } from "../extensionVars";
import { OCIFileExplorerNode } from "../oci-api";
import { GitExtension } from "../git";
import { getResourceManagerFolder, getResourceManagerArtifactHook } from "../common/fileSystem/local-terraform-config";
import { unzip, writeZipStreamToFile } from "../common/fileSystem/zip";
import path = require("path");
import * as nls from "vscode-nls";
import { METRIC_INVOCATION, METRIC_SUCCESS, METRIC_FAILURE } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import { MONITOR } from "../common/monitor";
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function getTFfileNodesByConfigType(configSource: any, profile: string, getStackResponse: any): Promise<OCIFileExplorerNode[]> {
    var configType: any;
    if(GitConfigSource.configSourceType === configSource){
        configType = getStackResponse.stack.configSource as GitConfigSource;
        return await getTFfileNodesByGitProvider(getStackResponse, configType);
    }
    else if(ObjectStorageConfigSource.configSourceType === configSource){
        configType = getStackResponse.stack.configSource as ObjectStorageConfigSource;
        return await getTFfileNodesByObjectStore(profile, getStackResponse, configType);
    }
    else if(ZipUploadConfigSource.configSourceType === configSource){
        return await getTFfileNodesByZipUpload(profile, getStackResponse);
    }
    else if(CompartmentConfigSource.configSourceType === configSource){
        return await getTFfileNodesByZipUpload(profile, getStackResponse);
    }
    return [];
}

async function getTFfileNodesByZipUpload(profile: string, getStackResponse: any): Promise<OCIFileExplorerNode[]> {
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'getTFfileNodesByZipUpload',undefined, getStackResponse.stack.id));        
        const terraformConfigDirectory = getResourceManagerArtifactHook().ensureDirectoryExists(getStackResponse.stack.id!);
        const tfconfResult = await getStackTfConfig(getStackResponse.stack.id);
        let tfStream = tfconfResult.value as any;
        const zipFilePath = path.join(terraformConfigDirectory, `${getStackResponse.stack.id!}.zip`);
        await writeZipStreamToFile(zipFilePath, tfStream);
        await unzip(terraformConfigDirectory, zipFilePath);
        let nodes = await populateFileNodes(getStackResponse);
        MONITOR.pushCustomMetric(Service.prepareMetricData(  METRIC_SUCCESS, 'getTFfileNodesByZipUpload',undefined, getStackResponse.stack.id));        
        return nodes;
    } catch (error) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'getTFfileNodesByZipUpload',undefined, getStackResponse.stack.id, 'Error in processing out .tf files for Stack {0} for type ZipUpload: '+JSON.stringify(error)));        
        getResourceManagerArtifactHook().remove(getStackResponse.stack.id!);
        logger().error(localize('getTfFilesByZipUploadErrorMsg','Error in processing out .tf files for Stack {0} for type ZipUpload: '), getStackResponse.stack.id);
        throw error;
    }
}

async function getTFfileNodesByObjectStore(profile: string, getStackResponse: any, configSource: ObjectStorageConfigSource): Promise<OCIFileExplorerNode[]> {
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'getTFfileNodesByObjectStore',undefined, getStackResponse.stack.id));
        const terraformConfigDirectory = getResourceManagerArtifactHook().ensureDirectoryExists(getStackResponse.stack.id!);
        const objectsList  = await getAllObjectsFromBucket({
            profile: profile,
            namespaceName: configSource.namespace,
            bucketName: configSource.bucketName
        });

        for (let obj of objectsList) {
            let object = await getTfConfigFromBucket({
                    profile: profile,
                    namespaceName: configSource.namespace,
                    bucketName: configSource.bucketName,
                    objectName: obj.name
            });
            let tfStream = object.value as any;
            const terraformFilePath = path.join(terraformConfigDirectory, obj.name);
            await writeZipStreamToFile(terraformFilePath, tfStream);
        }
        let nodes = await populateFileNodes(getStackResponse);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'getTFfileNodesByObjectStore',undefined, getStackResponse.stack.id));
        return nodes;
    } catch (error) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'getTFfileNodesByObjectStore',undefined, getStackResponse.stack.id, JSON.stringify(error)));
        getResourceManagerArtifactHook().remove(getStackResponse.stack.id!);
        logger().error(localize('getTfFilesByObjectStoreErrorMsg','Error in processing out .tf files for Stack {0} for type Object Store'), getStackResponse.stack.id);
        throw error;
    }
}

async function getTFfileNodesByGitProvider(getStackResponse: any, configSource: GitConfigSource): Promise<OCIFileExplorerNode[]> {
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'getTFfileNodesByGitProvider',undefined, getStackResponse.stack.id));        
        await commands.executeCommand("git.clone", configSource.repositoryUrl, getResourceManagerFolder(getStackResponse.stack.id));
        const gitExtension = extensions.getExtension<GitExtension>('vscode.git')?.exports;
        const git = gitExtension?.getAPI(1);
        const startIndex = configSource.repositoryUrl!.lastIndexOf("/") + 1;
        const lastIndex = configSource.repositoryUrl!.lastIndexOf(".");
        const cloneDirectory = configSource.repositoryUrl!.substring(startIndex, lastIndex);
        const uri = Uri.parse(path.join(getResourceManagerFolder(getStackResponse.stack.id), cloneDirectory));
        const respository = await git?.openRepository(uri);
        if (respository === undefined || respository === null) {
            throw new Error(localize('gitCloneFailedMsg',"Git clone failed"));
        }
        git?.getRepository(uri);
        await commands.executeCommand("git.checkout", respository, configSource.branchName);
        let nodes = await populateFileNodes(getStackResponse);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'getTFfileNodesByGitProvider',undefined, getStackResponse.stack.id));
        return nodes;
    } catch (error) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'getTFfileNodesByGitProvider',undefined, getStackResponse.stack.id, JSON.stringify(error)));
        getResourceManagerArtifactHook().remove(getStackResponse.stack.id!);
        logger().error(localize('getTfFilesByGitErrorMsg','Error in processing out .tf files for Stack {0} for type Git Provider'), getStackResponse.stack.id);
        throw error;
    }
}

export async function populateFileNodes(getStackResponse: any): Promise<OCIFileExplorerNode[]> {
        const nodes =  await ext.api.createFileExplorer({
            uri: Uri.file(getResourceManagerFolder(getStackResponse.stack.id)),
            type: FileType.Directory
        });
        const fileNodes = [];
        for (let i = 0; i < nodes.length; i++) {
            if (nodes[i].type === 2  && !nodes[i].id.includes("__MACOSX")) {
                fileNodes.push(nodes[i]);
            }
            if (nodes[i].type === 1  && !(nodes[i].id.includes(".DS_Store") || nodes[i].id.includes(".zip") || nodes[i].id.includes(".json") )) {
                fileNodes.push(nodes[i]);
            }
        }
        return fileNodes;
}
