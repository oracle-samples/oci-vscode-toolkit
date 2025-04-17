/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import {
    promptForWorkerName, promptForOPVP, promptForDataKey, promptForApmServerUrl, promptForInstallationDirectory,
    promptForCapability, promptForWorkerTarPath, promptForAuthType, promptForPriority, promptForContainerType,
    ContainerType
} from '../../../ui-helpers/ui-helpers';
import * as vscode from 'vscode';
import { ext } from '../../../extensionVars';
import { getPrivateDataKey } from '../../../api/apmdomain';
import { readBucketObject } from '../../../api/objectStorage';
import { getOnPremiseVantagePointDetails, ListOnPremiseVantagePoints, listPublicVantagePoints } from '../../../api/apmsynthetics';
import { ListWorkers, getWorker } from '../../../api/apmsynthetics';
import { WorkerSummary } from "oci-apmsynthetics/lib/model";
import { IOCIWorkerCreateInfo } from "../../../resourceinterfaces/ioci-worker-create-info";
import { IOCIWorkerUpdateInfo } from "../../../resourceinterfaces/ioci-worker-update-info";

export async function getWorkerList(apmDomainId: string, onPremiseVantagePointId: string):
    Promise<Array<WorkerSummary | undefined> | undefined> {
    const currentProfile = ext.api.getCurrentProfile();
    const profileName = currentProfile.getProfileName();
    return await ListWorkers(profileName, apmDomainId, onPremiseVantagePointId);
}

export async function updatePriorityInput(): Promise<IOCIWorkerUpdateInfo | undefined> {

    const priority = await promptForPriority(["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"]);
    if (priority === undefined) {
        return undefined;
    }

    return {
        priority
    };
}
export async function getWorkerInfo(apmDomainId: string, opvpId: string): Promise<IOCIWorkerCreateInfo | undefined> {

    const workerName = await promptForWorkerName();
    if (workerName === undefined) {
        return undefined;
    }

    const currentProfile = ext.api.getCurrentProfile();
    const profileName = currentProfile.getProfileName();

    const opVPs = opvpId ? [await getOnPremiseVantagePointDetails(apmDomainId, opvpId, profileName)]
        : await ListOnPremiseVantagePoints(apmDomainId, profileName);
    const opvpDisplayNames = await promptForOPVP(opVPs);
    if (opvpDisplayNames === undefined) {
        return undefined;
    }

    const dataKeys = await getPrivateDataKey(apmDomainId, profileName);
    const keys: any[] = [];
    dataKeys.forEach((item) => { keys.push(item.name); });
    const dataKeyName = await promptForDataKey(keys);
    if (dataKeyName === undefined) {
        return undefined;
    }
    let dataKey: string | undefined;
    dataKeys.forEach((item) => {
        if (item.name === dataKeyName) {
            dataKey = item.value;
        }
    });
    if (dataKey === undefined) {
        return undefined;
    }

    const realmMatch = currentProfile.getTenancy().match(/ocid1.tenancy.oc[0-9]+/) ?? ["oc1"];
    const realm = realmMatch[0].replace("ocid1.tenancy.", "");
    const suffix = getEndPointSuffix[realm] ?? "oci.oraclecloud.com";
    const ns = ProdNamespacesByRealm[realm] ?? "idpytqjfou7b";
    const apmUrl = `https://apm-synthetic.${currentProfile.getRegionName()}.${suffix}`;
    const apiUrl = await promptForApmServerUrl([apmUrl]);
    if (apiUrl === undefined) {
        return undefined;
    }

    const instDir = await promptForInstallationDirectory();
    if (instDir === undefined) {
        return undefined;
    }

    const caps = ["non-browser", "browser"];
    const capability = await promptForCapability(caps);
    if (capability === undefined) {
        return undefined;
    }

    const tarFile = await promptForWorkerTarPath();
    if (tarFile === undefined) {
        return undefined;
    }

    const authzType = "private_data_key";
    const authorizationType = await promptForAuthType([authzType]);
    if (authorizationType === undefined) {
        return undefined;
    }

    const content = await readBucketObject(profileName, capability, ns);

    const ctype = await promptForContainerType(Object.values(ContainerType));
    if (ctype === undefined) {
        return undefined;
    }

    return {
        displayName: workerName,
        opVantagePoints: opvpDisplayNames,
        domainPrivateDateKey: dataKey,
        synApiServerUrl: apiUrl,
        installationDir: instDir,
        capability: capability,
        workerTarFilePath: tarFile,
        authType: authorizationType,
        osContent: content,
        containerType: ctype
    };
}

interface StringMap {
    [key: string]: string;
}

export const ProdNamespacesByRealm: StringMap = {
    "oc1": "idpytqjfou7b",
    "oc2": "apmvpaasprodoc2",
    "oc3": "apmvpaasprodoc3",
    "oc4": "axqeoqwys2m2",
    "oc5": "axuxwyyuplbh",
    "oc8": "axicorakk3nq",
    "oc9": "axkrqmg3mrgl",
    "oc10": "axqoznao0pgp",
    "oc14": "axfmsafwuqhj",
    "oc15": "ax5re2v78x9y",
    "oc16": "axirip2w1aca",
    "oc17": "axlcetlveiw4",
    "oc19": "axogzqswgmcf",
    "oc20": "ax6gsrwvcjoa",
    "oc21": "ax2ht82jpwvz",
    "oc24": "axdxarnhguzu",
    "oc25": "axd02of1n9ji",
    "oc26": "axlg54segfbe",
    "oc27": "axjnxssxcifm",
    "oc28": "axubnrau2vzg"
};

export const getEndPointSuffix: StringMap = {
    "oc1": "oci.oraclecloud.com",
    "oc2": "oci.oraclegovcloud.com",
    "oc3": "oci.oraclegovcloud.com",
    "oc4": "oci.oraclegovcloud.uk",
    "oc5": "oci.oraclecloud5.com",
    "oc8": "oci.oraclecloud8.com",
    "oc9": "oci.oraclecloud9.com",
    "oc10": "oci.oraclecloud10.com",
    "oc14": "oci.oraclecloud14.com",
    "oc15": "oci.oraclecloud15.com",
    "oc16": "oci.oraclecloud16.com",
    "oc17": "oci.oraclecloud17.com",
    "oc19": "oci.oraclecloud.eu",
    "oc20": "oci.oraclecloud20.com",
    "oc21": "oci.oraclecloud21.com",
    "oc22": "oci.psn-pco.it",
    "oc24": "oci.oraclecloud24.com",
    "oc25": "oci.nricloud.jp",
    "oc26": "oci.oraclecloud26.com",
    "oc27": "oci.oraclecloud27.com",
    "oc28": "oci.oraclecloud28.com"
};