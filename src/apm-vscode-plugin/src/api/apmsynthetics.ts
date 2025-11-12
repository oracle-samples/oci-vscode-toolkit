/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { ApmSyntheticClient } from "oci-apmsynthetics";
import { getPrivateDataKey } from '../api/apmdomain';
import {
    ContentTypes, Monitor, MonitorSummary, MonitorTypes,
    PublicVantagePointSummary, OnPremiseVantagePoint, OnPremiseVantagePointSummary,
    ScriptSummary, Script, Worker, WorkerSummary,
    OnPremiseVantagePointWorkerStatus,
    MonitorStatus, MonitorScriptParameterInfo,
    MonitorResult, MonitorScriptParameter
} from "oci-apmsynthetics/lib/model";
import {
    DeleteMonitorResponse, DeleteWorkerResponse, DeleteOnPremiseVantagePointResponse,
    DeleteScriptResponse

} from "oci-apmsynthetics/lib/response";
import { clientConfiguration, getAuthProvider } from "./common";
import { DataKeySummary } from "oci-apmcontrolplane/lib/model";
import {
    IActionResult,
    newCancellation,
    newSuccess,
} from "../utils/actionResult";
import { ViewOutput } from '../webViews/ViewOutput';


const localize: nls.LocalizeFunc = nls.loadMessageBundle();

async function makeClient(profile: string): Promise<ApmSyntheticClient> {
    return new ApmSyntheticClient({
        authenticationDetailsProvider: await getAuthProvider(profile),
    }, clientConfiguration);
}

export async function getMonitor(
    apmDomainId: string,
    monitorId: string,
    profile: string
): Promise<Monitor> {
    var client = await makeClient(profile);
    let resp = await client.getMonitor({ apmDomainId, monitorId });
    return resp.monitor;
};

export async function getMonitorDetailsInOutput(
    apmDomainId: string,
    monitorId: string,
    profile: string,
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext
) {
    let mon = await getMonitor(apmDomainId, monitorId, profile);

    let updatedMonitor = JSON.parse(JSON.stringify(mon));
    let vpDisplayNameArray = mon.vantagePoints.map((element) => {
        return element.displayName;
    });

    const scriptParameters: MonitorScriptParameterInfo[] = mon?.scriptParameters ? mon.scriptParameters : [];
    let scriptParams: MonitorScriptParameter[] = [];
    scriptParameters.forEach((param, index) => {
        scriptParams.push(param?.monitorScriptParameter);
    });
    updatedMonitor["scriptParameters"] = scriptParams;
    updatedMonitor["vantagePoints"] = vpDisplayNameArray;

    let outputText = localize('monitorSummary', '\n {0}', JSON.stringify(updatedMonitor, null, '\t'));
    panel.webview.html = ViewOutput(panel.webview, context.extensionUri, "", outputText);
}


export async function listMonitors(
    apmDomainId: string,
    profile: string
): Promise<Array<MonitorSummary>> {
    var client = await makeClient(profile);
    let resp = await client.listMonitors({ "apmDomainId": apmDomainId });
    return resp.monitorCollection.items;
};

export async function createMonitor(
    profile: string,
    apmDomainId: string,
    monitorJson: any
): Promise<Monitor> {
    var client = await makeClient(profile);
    var resp = await client.createMonitor({
        apmDomainId, "createMonitorDetails": monitorJson
    });
    return resp.monitor;
};

export async function runNowMonitor(
    profile: string,
    apmDomainId: string,
    monitorId: string,
    monitorStatus: MonitorStatus
): Promise<Monitor> {
    var client = await makeClient(profile);
    let resp = await client.updateMonitor({ apmDomainId, monitorId, "updateMonitorDetails": { "isRunNow": true } });
    return resp.monitor;
};

export async function updateMonitorJson(
    profile: string,
    apmDomainId: string,
    monitorId: string,
    monitorJson: any
): Promise<Monitor> {
    var client = await makeClient(profile);
    var resp = await client.updateMonitor({ apmDomainId, monitorId, "updateMonitorDetails": monitorJson });
    return resp.monitor;
};

export async function deleteMonitor(
    profile: string,
    apmDomainId: string,
    monitorId: string
): Promise<DeleteMonitorResponse> {
    var client = await makeClient(profile);
    let resp = await client.deleteMonitor({ apmDomainId, monitorId });
    return resp;
};

export async function listScripts(
    apmDomainId: string,
    profile: string
): Promise<Array<ScriptSummary>> {
    var client = await makeClient(profile);
    let resp = await client.listScripts({ apmDomainId });
    return resp.scriptCollection.items;
};

export async function createScript(
    profile: string,
    apmDomainId: string,
    displayName: string,
    content: string,
    contentFileName: string,
    contentType: ContentTypes
): Promise<Script> {
    var client = await makeClient(profile);
    let resp = await client.createScript({ apmDomainId, "createScriptDetails": { "displayName": displayName, "contentType": contentType, "content": content, "contentFileName": contentFileName } });
    return resp.script;
};

export async function getScript(
    profile: string,
    apmDomainId: string,
    scriptId: string,
): Promise<Script> {
    var client = await makeClient(profile);
    let resp = await client.getScript({ apmDomainId, scriptId });
    return resp.script;
};

export async function getScriptDetailsInOutput(
    apmDomainId: string,
    scriptId: string,
    profile: string,
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext
) {
    let script = await getScript(profile, apmDomainId, scriptId);
    let monitorSummaryList = await listMonitorsForScript(profile, apmDomainId, scriptId);
    let monitorList = monitorSummaryList.map(mon => {
        let monJson = JSON.parse('{}');
        monJson["ocid"] = mon.id;
        monJson["name"] = mon.displayName;
        return monJson;
    });
    // Stringify and then parse getScript resp so as to convert type of script variable to JSON from type Script.
    // This is done to process/unset some of the fields.
    let scriptJSON = JSON.parse(JSON.stringify(script));
    scriptJSON["Monitors executing this script"] = monitorList;
    let outputText = localize('scriptSummary', '\n {0}', JSON.stringify(scriptJSON, null, '\t'));
    panel.webview.html = ViewOutput(panel.webview, context.extensionUri, "", outputText);
}

export async function updateScript(
    profile: string,
    apmDomainId: string,
    scriptId: string,
    displayName: string | undefined,
    content: string | undefined
): Promise<Script> {
    var client = await makeClient(profile);
    let updateScriptDetails = JSON.parse('{}');
    if (displayName !== undefined && displayName !== '') {
        updateScriptDetails["displayName"] = displayName;
    }
    if (content !== undefined && content !== "") {
        updateScriptDetails['content'] = content;
    }

    let resp = await client.updateScript({ apmDomainId, scriptId, "updateScriptDetails": updateScriptDetails });
    if (resp !== undefined) {
        updatMonitorStatus(profile, client, apmDomainId, scriptId, MonitorStatus.Enabled);
    }
    return resp?.script;
};

async function updatMonitorStatus(profile: string, client: ApmSyntheticClient, apmDomainId: string, scriptId: string, status: MonitorStatus) {
    // list monitors for given script   
    var items = await listMonitorsForScript(profile, apmDomainId, scriptId);
    items.forEach(mon => {
        var monitorId = mon.id;
        if (mon.status === MonitorStatus.Invalid) {
            client.updateMonitor({ apmDomainId, monitorId, "updateMonitorDetails": { "status": status } });
        }
    });
}

export async function listMonitorsForScript(profile: string, apmDomainId: string, scriptId: string): Promise<Array<MonitorSummary>> {
    var client = await makeClient(profile);
    // list monitors for given script
    let resp = await client.listMonitors({ "apmDomainId": apmDomainId, "monitorType": MonitorTypes.ScriptedBrowser, "scriptId": scriptId });
    return resp.monitorCollection.items;
}

export async function deleteScript(
    profile: string,
    apmDomainId: string,
    scriptId: string,
): Promise<DeleteScriptResponse> {
    var client = await makeClient(profile);
    let resp = await client.deleteScript({ apmDomainId, scriptId });
    return resp;
};

export async function listPublicVantagePoints(
    profile: string,
    apmDomainId: string
): Promise<Array<PublicVantagePointSummary>> {
    var client = await makeClient(profile);
    let vpResp = await client.listPublicVantagePoints({ apmDomainId });
    return vpResp.publicVantagePointCollection.items;
};

//worker command

export async function getApmDomainPrivateDataKey(
    apmDomainId: string,
    profile: string
): Promise<DataKeySummary[]> {
    var resp = await getPrivateDataKey(apmDomainId, profile);
    //return resp.filter((item: any) => item.type === "PRIVATE") ?? [];
    return resp;
}

export async function ListWorkers(
    apmDomainId: string,
    onPremiseVantagePointId: string,
    profile: string
): Promise<Array<WorkerSummary>> {
    var client = await makeClient(profile);
    let resp = await client.listWorkers({ apmDomainId, onPremiseVantagePointId });
    return resp.workerCollection.items;
}

export async function getWorker(
    apmDomainId: string,
    onPremiseVantagePointId: string,
    workerId: string,
    profile: string
): Promise<Worker> {
    var client = await makeClient(profile);
    var resp = await client.getWorker({ apmDomainId, onPremiseVantagePointId, workerId });
    return resp.worker;
}

export async function updateWorkerPriority(
    apmDomainId: string,
    onPremiseVantagePointId: string,
    workerId: string,
    priority: number,
    profile: string,
    outputChannel: vscode.OutputChannel
): Promise<IActionResult> {
    var client = await makeClient(profile);
    let updateWorkerDetails = JSON.parse('{}');
    updateWorkerDetails["priority"] = priority;
    const resp = await client.updateWorker({
        apmDomainId, onPremiseVantagePointId, workerId, "updateWorkerDetails": updateWorkerDetails
    });

    if (resp === undefined) {
        outputChannel.appendLine('Error: unable to update priority of worker ' + onPremiseVantagePointId + ', cancelling operation');
        outputChannel.appendLine('\n');
        return newCancellation();
    }
    outputChannel.appendLine('Updated ' + resp.worker.displayName + ' priority to ' + priority + '.');
    outputChannel.appendLine('\n');
    return newSuccess(resp);
}

export async function disableWorker(
    apmDomainId: string,
    onPremiseVantagePointId: string,
    workerId: string,
    profile: string,
    outputChannel: vscode.OutputChannel
): Promise<IActionResult> {
    var client = await makeClient(profile);
    let updateWorkerDetails = JSON.parse('{}');
    updateWorkerDetails["status"] = OnPremiseVantagePointWorkerStatus.Disabled;
    let resp = await client.updateWorker({
        apmDomainId, onPremiseVantagePointId, workerId, "updateWorkerDetails": updateWorkerDetails
    });
    if (resp === undefined) {
        outputChannel.appendLine('Error: failed to disable worker ' + onPremiseVantagePointId + ', cancelling operation');
        outputChannel.appendLine('\n');
        return newCancellation();
    }
    outputChannel.appendLine('Disabled worker ' + resp.worker.displayName + '.');
    outputChannel.appendLine('\n');
    return newSuccess(resp);
}

export async function deleteWorker(
    apmDomainId: string,
    onPremiseVantagePointId: string,
    workerId: string,
    profile: string
): Promise<DeleteWorkerResponse> {
    var client = await makeClient(profile);
    let resp = await client.deleteWorker({ apmDomainId, onPremiseVantagePointId, workerId });
    return resp;
}

// opvp command

export async function ListOnPremiseVantagePoints(
    apmDomainId: string,
    profile: string
): Promise<Array<OnPremiseVantagePointSummary>> {
    var client = await makeClient(profile);
    let resp = await client.listOnPremiseVantagePoints({ apmDomainId });
    return resp.onPremiseVantagePointCollection.items;
}

export async function createOnPremiseVantagePoint(
    profile: string,
    apmDomainId: string,
    displayName: string,
    description: string
    //type: CreateOnPremiseVantagePointDetails.Type
): Promise<OnPremiseVantagePoint> {
    var client = await makeClient(profile);
    let resp = await client.createOnPremiseVantagePoint(
        {
            apmDomainId, "createOnPremiseVantagePointDetails": {
                "name": displayName,
                "description": description
                //, "type": type
            }
        });
    return resp.onPremiseVantagePoint;
};

export async function getOnPremiseVantagePointDetails(
    apmDomainId: string,
    onPremiseVantagePointId: string,
    profile: string
): Promise<OnPremiseVantagePoint> {
    var client = await makeClient(profile);
    let resp = await client.getOnPremiseVantagePoint({ apmDomainId, onPremiseVantagePointId });
    return resp.onPremiseVantagePoint;
}

export async function deleteOnPremiseVantagePoint(
    profile: string,
    apmDomainId: string,
    onPremiseVantagePointId: string
): Promise<DeleteOnPremiseVantagePointResponse> {
    var client = await makeClient(profile);
    let resp = await client.deleteOnPremiseVantagePoint({ apmDomainId, onPremiseVantagePointId });
    return resp;
};

export async function getMonitorResult(
    profile: string,
    apmDomainId: string,
    monitorId: string,
    vantagePoint: string,
    resultType: string,
    resultContentType: string,
    executionTime: string
): Promise<MonitorResult | undefined> {
    var client = await makeClient(profile);
    let resp;
    try {
        resp = await client.getMonitorResult({ "apmDomainId": apmDomainId, "monitorId": monitorId, "vantagePoint": vantagePoint, "resultType": resultType, "resultContentType": resultContentType, "executionTime": executionTime });
        return resp.monitorResult;
    } catch (e) {
        console.error(e);
        vscode.window.showErrorMessage(localize('getMonitorResultErr', 'Error: Requested resource not found or invalid'));
    }
    return undefined;
}