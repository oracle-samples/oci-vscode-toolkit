/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import st = require("stream");
import { clientConfiguration, getAuthProvider } from './common';
import { ObjectStorageClient } from 'oci-objectstorage';
import { writeToFile } from '../ui/commands/scriptOperations/script-operations';
import { GetBucketRequest, GetNamespaceRequest, GetObjectRequest } from 'oci-objectstorage/lib/request';
import { request } from "http";

async function makeClient(profile: string): Promise<ObjectStorageClient> {
    return new ObjectStorageClient({
        authenticationDetailsProvider: await getAuthProvider(profile),
    }, clientConfiguration);
}

export async function getNamespaceForTenancy(profile: string, tenancyId: string): Promise<string> {
    return await getNamespace(profile, tenancyId);
}

export async function getNamespaceForUser(profile: string): Promise<string> {
    return await getNamespace(profile);
}

async function getNamespace(profile: string, tenancyId?: string): Promise<string> {
    const client = await makeClient(profile);
    const request: GetNamespaceRequest = {
        compartmentId: tenancyId
    };
    const response = await client.getNamespace(request);
    return response.value;
}

export async function downloadTar(namespace: string, bucket: string, object: string,
    downloadPath: string, profile: string, outputChannel: vscode.OutputChannel): Promise<string> {
    const client = await makeClient(profile);
    const request: GetObjectRequest = {
        namespaceName: namespace,
        bucketName: bucket,
        objectName: object
    };
    const response = await client.getObject(request);
    let content = await streamToString(response.value as st.Readable);
    writeToFile(content, downloadPath, 'utf8', outputChannel);
    return 'done';
}

export async function readBucketObject(profile: string, capability: string, namespace: string): Promise<string> {
    const client = await makeClient(profile);
    const request: GetObjectRequest = {
        namespaceName: namespace,
        bucketName: "apm-synthetics-opvp",
        objectName: capability === "non-browser" ? "synthetic-opvp/synagentrest/x86_64/metadata.xml" : "synthetic-opvp/synagent/x86_64/metadata.xml"
    };
    const response = await client.getObject(request);
    let fetchResp = await streamToString(response.value as st.Readable);
    const img = fetchResp.match(/<resource>[a-z0-9-]+<\/resource>/);
    const ver = fetchResp.match(/<version>[a-z0-9.]+<\/version>/);
    const platform = fetchResp.match(/<platform>[a-z0-9_]+<\/platform>/) ?? 'x86_64';
    let output = "undefined:undefined";
    if (img && ver) {
        let osname = platform[0].replace(/(<([^>]+)>)/ig, "");
        output = img[0].replace(/(<([^>]+)>)/ig, "").replace("docker", osname);
        output += ":" + ver[0].replace(/(<([^>]+)>)/ig, "");
    }
    return output;
}

async function streamToString(stream: NodeJS.ReadableStream): Promise<string> {
    const chunks: Array<any> = [];
    for await (let chunk of stream) {
        chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);
    return buffer.toString("utf-8");
}