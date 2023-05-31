/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { METRIC_INVOCATION, METRIC_SUCCESS, METRIC_FAILURE } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import * as objectstorage from "oci-objectstorage";
import { readAsStreamFromFile } from "../common/fileSystem/file-system";
import { MONITOR } from "../common/monitor";
import { clientConfiguration, getAuthProvider } from './client-configurations';

async function getObjectStorageClient(profile: string): Promise<objectstorage.ObjectStorageClient> {
    return new objectstorage.ObjectStorageClient({ authenticationDetailsProvider: await getAuthProvider(profile)}, clientConfiguration);
}

export async function getAllObjectsFromBucket( {
    profile,
    namespaceName,
    bucketName
}: { 
    profile: string;
    namespaceName: string;
    bucketName: string;
}): Promise<objectstorage.models.ObjectSummary[]>{
    let listObjectsResponse;
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'getAllObjectsFromBucket', undefined));
        const client = await getObjectStorageClient(profile);
        
        const listObjectRequest: objectstorage.requests.ListObjectsRequest = {
            namespaceName: namespaceName,
            bucketName: bucketName
          };

        listObjectsResponse = await client.listObjects(listObjectRequest);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'getAllObjectsFromBucket', undefined));
        return listObjectsResponse.listObjects.objects;

    } catch (exception) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'getAllObjectsFromBucket', undefined, undefined, JSON.stringify(exception)));    
        throw exception;
    }
} 

export async function getTfConfigFromBucket( {
    profile,
    namespaceName,
    bucketName,
    objectName,
}: { 
    profile: string;
    namespaceName: string;
    bucketName: string;
    objectName: string
}): Promise<objectstorage.responses.GetObjectResponse>{
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'getTfConfigFromBucket', undefined));
        const client = await getObjectStorageClient(profile);
        const getObjectRequest: objectstorage.requests.GetObjectRequest = {
            namespaceName: namespaceName,
            bucketName: bucketName,
            objectName: objectName,
          };
          MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'getTfConfigFromBucket', undefined));
        return await client.getObject(getObjectRequest);
    } catch (exception) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'getTfConfigFromBucket', undefined, undefined, JSON.stringify(exception)));    
        throw exception;
    }
} 

export async function updateTfConfig(
    profile: string,
    namespaceName: string,
    bucketName: string,
    filePath: string
): Promise<objectstorage.responses.PutObjectResponse>{
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'updateTfConfig', undefined, bucketName, namespaceName));
        const client = await getObjectStorageClient(profile);
    
         const putObjectRequest: objectstorage.requests.PutObjectRequest = {
            namespaceName: namespaceName,
            bucketName: bucketName,
            objectName: filePath.substring(filePath.lastIndexOf("/") + 1),
            putObjectBody: readAsStreamFromFile(filePath)
        };
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'updateTfConfig', undefined, bucketName, namespaceName));
        return await client.putObject(putObjectRequest);
    } catch (exception) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'updateTfConfig', undefined, bucketName, JSON.stringify(exception)));
        throw exception;
    }
} 
