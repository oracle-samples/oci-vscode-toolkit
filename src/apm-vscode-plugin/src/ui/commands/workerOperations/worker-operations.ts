/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { ext } from '../../../extensionVars';
import {
    IActionResult,
    newCancellation,
    newSuccess,
} from '../../../utils/actionResult';
import { getWorkerInfo, updatePriorityInput } from '../ui/get-worker-info';
import { getWorker, updateWorkerPriority } from "../../../api/apmsynthetics";
import { Worker } from "oci-apmsynthetics/lib/model";

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function createNewWorker(apmDomainId: string, opvpId: string,
    outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    return workerInstruction(apmDomainId, opvpId, outputChannel);
}

export async function createNewWorkerOpvp(apmDomainId: string, opvpId: string,
    outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    return workerInstruction(apmDomainId, opvpId, outputChannel);
}

async function workerInstruction(apmDomainId: string, opvpId: string,
    outputChannel: vscode.OutputChannel): Promise<IActionResult> {

    const currentProfile = ext.api.getCurrentProfile();
    const workerInfo = await getWorkerInfo(apmDomainId, opvpId);
    if (workerInfo === undefined) {
        return newCancellation();
    }
    const { displayName, opVantagePoints, domainPrivateDateKey, synApiServerUrl, installationDir,
        capability, workerTarFilePath, authType, osContent, containerType } = workerInfo;
    const image: string[] = osContent.split(':');
    let AGENT_SERVICE = 'vp-agent-syn-rest-dockerize_service_linux_x86_64';
    let IMAGE_VERSION = image[1];
    let IMAGE_NAME = image[0];
    let MEMORY = '2g';
    let SHM_SIZE = '500M';

    if (capability === 'browser') {
        AGENT_SERVICE = 'vp-agent-syn-siderunner-dockerize_service';
        MEMORY = '4g';
        SHM_SIZE = '4096M';
    }

    let workerCommand = `export VERSION=\`${workerInfo.containerType.toLowerCase()} --version\`; 
mkdir -p ${workerInfo.installationDir}/${workerInfo.opVantagePoints[0]?.vpInternalName}/${workerInfo.displayName};
chmod -R og+rw ${workerInfo.installationDir}/${workerInfo.opVantagePoints[0]?.vpInternalName}/${workerInfo.displayName};
docker load --input ${workerInfo.workerTarFilePath} && docker tag local.local/${AGENT_SERVICE}:${IMAGE_VERSION} ${IMAGE_NAME}:${IMAGE_VERSION};
docker stop '${workerInfo.displayName}' > /dev/null 2>&1;
docker rm '${workerInfo.displayName}' > /dev/null 2>&1;
docker run \\\
\n--name ${workerInfo.displayName} \\\
\n--memory=${MEMORY} \\\
\n--memory-swap=${MEMORY} \\\
\n--detach=true \\\
\n--tty=true \\\
\n--shm-size=${SHM_SIZE} \\\
\n--restart=unless-stopped \\\
\n-e CONTAINER_TYPE="${workerInfo.containerType.toUpperCase()}" \\\
\n-e CONTAINER_VERSION="$VERSION" \\\
\n-e WORKER_NAME='${workerInfo.displayName}' \\\
\n-e APM_DOMAIN_OCID='${apmDomainId}' \\\
\n-e OPVP_OCID='${workerInfo.opVantagePoints[0]?.ocid}' \\\
\n-e APM_DOMAIN_PRIVATE_DATA_KEY='${workerInfo.domainPrivateDateKey}' \\\
\n-e SYN_API_SERVER='${workerInfo.synApiServerUrl}' \\\
\n-e AUTH_TYPE='private_data_key' \\\
\n-e LOG_LEVEL='INFO'  \\\
\n-v ${workerInfo.installationDir}/${workerInfo.opVantagePoints[0]?.vpInternalName}/${workerInfo.displayName}:/worker \\\
\n${IMAGE_NAME}:${IMAGE_VERSION};
`;

    outputChannel.appendLine(workerCommand);
    outputChannel.appendLine('\n');

    return newSuccess(outputChannel);
}

export async function updatePriority(apmDomainId: string, opvpId: string, workerId: string,
    outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    const currentProfile = ext.api.getCurrentProfile();
    let priorObj = await updatePriorityInput();

    if (priorObj === undefined) {
        return newCancellation();
    }
    const { priority } = priorObj;
    const r = updateWorkerPriority(apmDomainId, opvpId, workerId, priorObj.priority, currentProfile.getProfileName(), outputChannel);
    return newSuccess(r);
}

export async function getWorkerResults(apmDomainId: string, opvpId: string, workerId: string,
    outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    const currentProfile = ext.api.getCurrentProfile();
    const r = getWorkerSummary(currentProfile.getProfileName(), workerId, apmDomainId, opvpId, outputChannel);
    return newSuccess(r);
}

export async function getWorkerSummary(profile: string, workerId: string, apmDomainId: string,
    opvpId: string, outputChannel: vscode.OutputChannel) {

    const workerInfo = await getWorker(apmDomainId, opvpId, workerId, profile);
    if (workerInfo === undefined) {
        outputChannel.appendLine(localize('workerDataNotFound', 'Error: worker data not found, cancelling operation'));
        return newCancellation();
    }
    //const { displayName, id, timeUpdated, workerType, priority, versionDetails, status } = workerInfo;

    let workerObj: Worker = JSON.parse(JSON.stringify(workerInfo));
    workerObj.timeUpdated = new Date("" + workerObj.timeUpdated);

    let monitorList = {};
    if (workerInfo.monitorList) {
        monitorList = workerInfo.monitorList.map(element => {
            return `Name: ${element.displayName}, Type: ${element.monitorType}`;
        });
    }
    outputChannel.appendLine(localize('workerSummary', '---Worker Summary---'));
    outputChannel.appendLine(localize('workerDetails', "Worker Name: {0} \nOPVP name: {1} \nWorker update time: {2}  \nType: {3} \nPriority: {4} \nStatus:{5} \nMonitor List: {6} \nVersion: {7} \nWorker Ocid: {8}\n",
        workerInfo.displayName, workerInfo.opvpName, workerObj.timeUpdated?.toUTCString(),
        workerInfo.workerType, workerInfo.priority, workerInfo.status,
        JSON.stringify(monitorList), workerInfo.versionDetails?.latestVersion, workerInfo.id));
}