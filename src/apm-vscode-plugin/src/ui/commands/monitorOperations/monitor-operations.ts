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
    newError,
    newSuccess,
} from '../../../utils/actionResult';
import { getMetricDataPointsTimeRangeInfo, getMonitorResultInfo } from '../ui/get-monitor-info';
import { createMonitor, getMonitorDetailsInOutput, getMonitorResult, runNowMonitor, updateMonitorJson } from "../../../api/apmsynthetics";
import { getMonitorExecutionResults } from '../../../api/telemetry';
import { MonitorStatus, VantagePointInfo } from 'oci-apmsynthetics/lib/model';
import { writeToFile } from '../scriptOperations/script-operations';
import { ViewOutput } from '../../../webViews/ViewOutput';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function webviewSaveMonitorJson(displayName: string, monitorJsonOrig: any, panel: vscode.WebviewPanel,
    outputChannel: vscode.OutputChannel): Promise<IActionResult> {

    writeToFile(JSON.stringify(monitorJsonOrig), displayName + '.json', 'utf8', outputChannel);
    return newSuccess(null);
}

export async function webviewCreateNewMonitor(apmDomainId: string, monitorJson: any, panel: vscode.WebviewPanel): Promise<IActionResult> {
    return createNewMonitor(apmDomainId, monitorJson, panel);
}

export async function webviewEditMonitor(apmDomainId: string, monitorId: string,
    monitorJson: any, panel: vscode.WebviewPanel): Promise<IActionResult> {
    // console.log('webviewEditMonitor ... ' + JSON.stringify(monitorJson));
    if (monitorJson && Object.keys(monitorJson).length === 0) {
        const noChangeMessage = localize("monitorNoChangeMessage", 'No change in monitor data.');
        vscode.window.showWarningMessage(
            noChangeMessage, { modal: false }
        );
        //vscode.window.showErrorMessage(noChangeMessage);
        //panel.dispose(); // do not dispose as it might be accidental click
        return newError(noChangeMessage);
    }
    try {
        const currentProfile = ext.api.getCurrentProfile();
        const r = await updateMonitorJson(currentProfile.getProfileName(), apmDomainId, monitorId, monitorJson);
        const operationSuccessMessage = localize("operationUpdateSuccessMessage", 'Monitor updation is successful.');
        vscode.window.showInformationMessage(
            operationSuccessMessage, { modal: false }
        );
        if (panel !== undefined) {
            panel.dispose();
        }
        return newSuccess(r);
    } catch (e) {
        let errorMessage = localize("monitorUpdateErrorMessage", 'Error occurred while updating monitor.');
        if (typeof e === "string") {
            vscode.window.showErrorMessage(e.toUpperCase());
            errorMessage = e.toUpperCase();
        } else if (e instanceof Error) {
            vscode.window.showErrorMessage(e.message);
            errorMessage = e.message;
        }
        // throw e;
        return newError(errorMessage);
    }
}

export async function createNewMonitor(apmDomainId: string, monitorJson: any, panel: vscode.WebviewPanel | undefined): Promise<IActionResult> {
    try {
        const monitorType = monitorJson['monitorType'];
        if (monitorType !== 'SCRIPTED_BROWSER') {
            vscode.window.showErrorMessage(localize("incorrectMonitorTypeMsg", 'Incorrect monitor type found, supported type is SCRIPTED BROWSER'));
            return newCancellation();;
        }
        const currentProfile = ext.api.getCurrentProfile();
        const r = await createMonitor(
            currentProfile.getProfileName(),
            apmDomainId,
            monitorJson
        );
        const operationSuccessMessage = localize("operationCreateSuccessMessage", 'Monitor creation is successful.');
        vscode.window.showInformationMessage(
            operationSuccessMessage, { modal: false }
        );
        if (panel !== undefined) {
            panel.dispose();
        }

        return newSuccess(r);
    } catch (e) {
        let errorMessage = localize("monitorCreateErrorMessage", 'Error occurred while creating monitor.');
        if (typeof e === "string") {
            vscode.window.showErrorMessage(e.toUpperCase());
            errorMessage = e.toUpperCase();
        } else if (e instanceof Error) {
            vscode.window.showErrorMessage(e.message);
            errorMessage = e.message;
        }
        // throw e;
        return newError(errorMessage);
    }
}

export async function runNow(apmDomainId: string, monitorId: string, monitorStatus: MonitorStatus): Promise<IActionResult> {
    const currentProfile = ext.api.getCurrentProfile();
    const r = runNowMonitor(currentProfile.getProfileName(), apmDomainId!, monitorId, monitorStatus);
    return newSuccess(r);
}

export async function getMonitorResultMetrics(monitorId: string, monitorName: string, compartmentId: string,
    panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<IActionResult> {
    const currentProfile = ext.api.getCurrentProfile();
    const timeRangeInfo = await getMetricDataPointsTimeRangeInfo();
    if (timeRangeInfo === undefined) {
        return newCancellation();
    }
    const { startDate, endDate } = timeRangeInfo;
    const r = getMonitorExecutionResults(currentProfile.getProfileName(), monitorId, monitorName, compartmentId,
        panel, context, startDate, endDate);
    return newSuccess(r);
}

export async function viewErrorMessage(apmDomainId: string, monitorId: string, monitorType: string,
    vantagePoints: Array<VantagePointInfo>, panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<IActionResult> {
    return getDiagnosticResult(apmDomainId, monitorId, monitorType, vantagePoints, "diagnostics", "raw", panel, context);
}

export async function getHar(apmDomainId: string, monitorId: string,
    vantagePoints: Array<VantagePointInfo>, outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    return getResult(apmDomainId, monitorId, vantagePoints, "har", "zip", outputChannel);
}

export async function getScreenshots(apmDomainId: string, monitorId: string,
    vantagePoints: Array<VantagePointInfo>, outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    return getResult(apmDomainId, monitorId, vantagePoints, "screenshot", "zip", outputChannel);
}

export async function getLogs(apmDomainId: string, monitorId: string,
    vantagePoints: Array<VantagePointInfo>, outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    return getResult(apmDomainId, monitorId, vantagePoints, "log", "zip", outputChannel);
}

export async function getResult(apmDomainId: string, monitorId: string,
    vantagePoints: Array<VantagePointInfo>, resultType: string,
    resultContentType: string, outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    try {
        const monitorResultInfo = await getMonitorResultInfo(apmDomainId, vantagePoints);
        if (monitorResultInfo === undefined) {
            return newCancellation();
        }

        const { vantagePoint, executionTime } = monitorResultInfo;
        const currentProfile = ext.api.getCurrentProfile();
        const r = await getMonitorResult(currentProfile.getProfileName(), apmDomainId, monitorId, vantagePoint, resultType, resultContentType, executionTime);
        if (r === undefined) {
            return newCancellation();
        }
        const resultDataSet = r.resultDataSet;
        if (resultDataSet === undefined) {
            vscode.window.showErrorMessage(localize('resultDataSetNotFound', 'Error: result data set not found, cancelling operation'));
            return newCancellation();
        }

        const content = resultDataSet[0].byteContent;
        if (content === undefined) {
            vscode.window.showErrorMessage(localize('fileContentNotFound', 'Error: file content not found, cancelling operation'));
            return newCancellation();
        }
        const fileName = resultDataSet[0].name;
        if (fileName === undefined) {
            vscode.window.showErrorMessage(localize('fileNotFound', 'Error: file name not found, cancelling operation'));
            return newCancellation();
        }

        writeToFile(content, fileName, 'base64', outputChannel);

        return newSuccess(r);
    } catch (e) {
        let errorMessage = localize("getResultErrorMessage", 'Error occurred while fetching monitor result.');
        if (typeof e === "string") {
            vscode.window.showErrorMessage(e.toUpperCase());
            errorMessage = e.toUpperCase();
        } else if (e instanceof Error) {
            vscode.window.showErrorMessage(e.message);
            errorMessage = e.message;
        }
        // throw e;
        return newError(errorMessage);
    }
}

export async function getDiagnosticResult(apmDomainId: string, monitorId: string, monitorType: string,
    vantagePoints: Array<VantagePointInfo>, resultType: string,
    resultContentType: string, panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<IActionResult> {
    try {
        const monitorResultInfo = await getMonitorResultInfo(apmDomainId, vantagePoints);
        if (monitorResultInfo === undefined) {
            return newCancellation();
        }

        const { vantagePoint, executionTime } = monitorResultInfo;
        const currentProfile = ext.api.getCurrentProfile();
        const r = await getMonitorResult(currentProfile.getProfileName(), apmDomainId, monitorId, vantagePoint, resultType, resultContentType, executionTime);
        if (r === undefined) {
            return newCancellation();
        }
        const resultDataSet = r.resultDataSet;
        if (resultDataSet === undefined) {
            vscode.window.showErrorMessage(localize('resultDataSetNotFound', 'Error: result data set not found, cancelling operation'));
            return newCancellation();
        }

        let content = resultDataSet[0].stringContent;
        if (content === undefined) {
            vscode.window.showErrorMessage(localize('fileContentNotFound', 'Error: content not found, cancelling operation'));
            return newCancellation();
        }
        content = content.replace(/(\r\n|\n|\r)/gm, "");
        let jsonErrContent = JSON.parse(content).metrics[0].labels.ErrorMessage;
        // add try/catch to handle case when ErrorMessage is NONE or not a json object
        try {
            jsonErrContent = JSON.parse(jsonErrContent.replace(/(\r\n|\n|\r)/gm, ""));
            if (monitorType === "SCRIPTED_BROWSER" && jsonErrContent["CN"] !== undefined) {
                let cn = "Selenium Command Name: " + jsonErrContent["CN"] + "\n";
                let cs = "Selenium Command Sequemce: " + jsonErrContent["CS"] + "\n";
                let as = "Selenium APM Step: " + jsonErrContent["AS"] + "\n";
                let cr = "Selenium Command Failure Reason: " + jsonErrContent["CR"] + "\n";
                jsonErrContent = cn + cs + as + cr;
            }
        } catch (e) { }

        let outputText = localize("jsonErrContent", "\n{0}", jsonErrContent);
        panel.webview.html = ViewOutput(panel.webview, context.extensionUri,
            "Error Message", outputText);

        return newSuccess(r);
    } catch (e) {
        let errorMessage = localize("getResultErrorMessage", 'Error occurred while fetching monitor result.');
        if (typeof e === "string") {
            vscode.window.showErrorMessage(e.toUpperCase());
            errorMessage = e.toUpperCase();
        } else if (e instanceof Error) {
            vscode.window.showErrorMessage(e.message);
            errorMessage = e.message;
        }
        // throw e;
        return newError(errorMessage);
    }
}

export async function getMonitorDetails(monitorId: string, apmDomainId: string,
    panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<IActionResult> {
    const currentProfile = ext.api.getCurrentProfile().getProfileName();
    const r = getMonitorDetailsInOutput(apmDomainId, monitorId, currentProfile, panel, context);
    return newSuccess(r);
}

