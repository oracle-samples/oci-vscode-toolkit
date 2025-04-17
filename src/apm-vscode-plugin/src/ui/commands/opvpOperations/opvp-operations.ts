/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { ext } from '../../../extensionVars';
import { OnPremiseVantagePoint } from "oci-apmsynthetics/lib/model";
import {
    IActionResult,
    newCancellation,
    newSuccess,
} from '../../../utils/actionResult';
import { getOpvpInfo } from '../ui/get-opvp-info';
import { downloadTar, readBucketObject } from '../../../api/objectStorage';
import { getEndPointSuffix, ProdNamespacesByRealm } from '../ui/get-worker-info';
import { createOnPremiseVantagePoint, getOnPremiseVantagePointDetails, deleteOnPremiseVantagePoint } from "../../../api/apmsynthetics";

export async function createNewOnPremiseVantagePoint(apmDomainId: string): Promise<IActionResult> {
    const opvpInfo = await getOpvpInfo(apmDomainId);
    if (opvpInfo === undefined) {
        return newCancellation();
    }

    const { displayName, description } = opvpInfo;
    const currentProfile = ext.api.getCurrentProfile();
    const r = await createOnPremiseVantagePoint(
        currentProfile.getProfileName(),
        apmDomainId,
        displayName,
        description
    );
    return newSuccess(r);
}

export async function downloadRestImage(apmDomainId: string,
    outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    return downloadImage(apmDomainId, "non-browser", "tar", outputChannel);
}

export async function downloadSideImage(apmDomainId: string,
    outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    return downloadImage(apmDomainId, "browser", "tar", outputChannel);
}


export async function downloadImage(apmDomainId: string, capability: string,
    resultContentType: string, outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    const localize: nls.LocalizeFunc = nls.loadMessageBundle();

    const currentProfile = ext.api.getCurrentProfile();
    const realmMatch = currentProfile.getTenancy().match(/ocid1.tenancy.oc[0-9]+/) ?? ["oc1"];
    const realm = realmMatch[0].replace("ocid1.tenancy.", "");
    const suffix = getEndPointSuffix[realm] ?? "oci.oraclecloud.com";
    const namespace = ProdNamespacesByRealm[realm] ?? "idpytqjfou7b";

    const imageVersion = await readBucketObject(currentProfile.getProfileName(), capability, namespace);
    const image: string[] = imageVersion.split(':');
    let cliCommand = `oci os object get -ns ${namespace} -bn apm-synthetics-opvp --name synthetic-opvp/synagentrest/x86_64/${image[1]}/apm-synthetic-worker-nonbrowser-docker-${image[1]}.tar.gz --file apm-synthetic-worker-nonbrowser-x86_64-${image[1]}.tar.gz`;
    if (capability === 'browser') {
        cliCommand = cliCommand.replace('rest', '').replace('nonbrowser-x86_64', 'browser-docker').replace('non', '');
    }

    outputChannel.appendLine(localize('downloadWorkerCli', "\nTo download worker via CLI, copy and execute the following command: \n{0}\n", cliCommand));

    //let bucket = "apm-synthetics-opvp";
    //let objectName = "synthetic-opvp/synagentrest/x86_64/1.2.0.152/apm-synthetic-worker-nonbrowser-docker-1.2.0.152.tar.gz";
    //let objectName = "synthetic-opvp/synagentrest/x86_64/metadata.xml";
    //let downloadPath = "/Users/pushpendra/Downloads";
    //const r = downloadTar(namespace, bucket, objectName, downloadPath, currentProfile.getProfileName(), outputChannel);

    return newSuccess(outputChannel);
}

export async function getOnPremiseVantagePointResults(opvpId: string, apmDomainId: string, outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    const localize: nls.LocalizeFunc = nls.loadMessageBundle();
    const currentProfile = ext.api.getCurrentProfile();
    const opvpInfo = await getOnPremiseVantagePointDetails(apmDomainId, opvpId, currentProfile.getProfileName());
    if (opvpInfo === undefined) {
        outputChannel.appendLine(localize('opvpDetailsNotFound', 'Error: opvp details not found, cancelling operation'));
        return newCancellation();
    }

    //const { id, displayName, timeUpdated, workersSummary } = opvpInfo;
    let opvpObj: OnPremiseVantagePoint = JSON.parse(JSON.stringify(opvpInfo));
    opvpObj.timeUpdated = new Date("" + opvpObj.timeUpdated);

    outputChannel.appendLine(localize('onPremiseVantagePointSummary', '---On-premise Vantage Point Summary---'));
    outputChannel.appendLine(localize('onPremiseVantagePointDetails', "OPVP Name: {0} \nOPVP update time: {1} \nTotal worker: {2} \nAvailable worker: {3} \nUsed worker: {4} \nOPVP ocid: {5}\n",
        opvpInfo.displayName, opvpObj.timeUpdated?.toUTCString(), opvpInfo.workersSummary?.total, opvpInfo.workersSummary?.available, opvpInfo.workersSummary?.used, opvpInfo.id));

    return newSuccess(outputChannel);
}