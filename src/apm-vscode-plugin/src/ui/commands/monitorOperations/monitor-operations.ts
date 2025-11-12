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
import { getMonitorResultInfo, getMetricTimeRangeInfo } from '../ui/get-monitor-info';
import { createMonitor, getMonitorDetailsInOutput, getMonitorResult, runNowMonitor, updateMonitorJson } from "../../../api/apmsynthetics";
import { formatDateUiUTC, getMonitorExecutionResults } from '../../../api/telemetry';
import { MonitorStatus, VantagePointInfo } from 'oci-apmsynthetics/lib/model';
import { writeToFile } from '../scriptOperations/script-operations';
import { ViewOutput } from '../../../webViews/ViewOutput';
import { ViewScreenshots } from '../../../webViews/ViewScreenshots';
import { ViewHar } from '../../../webViews/ViewHar';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

/** unused */
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

export async function getMonitorExecutionResultMetrics(apmDomainId: string, monitorId: string, monitorType: string, monitorName: string,
    compartmentId: string, selectedTime: string, start: string | undefined, end: string | undefined,
    panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<IActionResult> {
    const currentProfile = ext.api.getCurrentProfile();
    const timeRangeInfo = await getMetricTimeRangeInfo(selectedTime, start, end);
    if (timeRangeInfo === undefined) {
        return newCancellation();
    }
    const { startDate, endDate } = timeRangeInfo;
    const r = getMonitorExecutionResults(apmDomainId, currentProfile.getProfileName(), monitorId, monitorType, monitorName, compartmentId,
        panel, context, startDate, endDate);
    return newSuccess(r);
}

export async function viewErrorMessage(apmDomainId: string, monitorId: string, monitorType: string, monitorName: string,
    vantagePoint: string, executionTime: string, panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<IActionResult> {
    return getRawResult(apmDomainId, monitorId, monitorType, monitorName, vantagePoint, executionTime, "diagnostics", "raw", panel, context);
}

export async function getHar(apmDomainId: string, monitorId: string,
    vantagePoints: Array<VantagePointInfo>, outputChannel: vscode.OutputChannel,
    executionTime: string | undefined, vantagePoint: string | undefined): Promise<IActionResult> {
    return getResult(apmDomainId, monitorId, vantagePoints, "har", "zip", outputChannel, executionTime, vantagePoint);
}

export async function viewHar(apmDomainId: string, monitorId: string, monitorType: string, monitorName: string,
    vantagePoint: string, executionTime: string, panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<IActionResult> {
    return getRawResult(apmDomainId, monitorId, monitorType, monitorName, vantagePoint, executionTime, "har", "raw", panel, context);
}

export async function getScreenshots(apmDomainId: string, monitorId: string,
    vantagePoints: Array<VantagePointInfo>, outputChannel: vscode.OutputChannel,
    executionTime: string | undefined, vantagePoint: string | undefined): Promise<IActionResult> {
    return getResult(apmDomainId, monitorId, vantagePoints, "screenshot", "zip", outputChannel, executionTime, vantagePoint);
}

export async function viewScreenshots(apmDomainId: string, monitorId: string, monitorType: string, monitorName: string,
    vantagePoint: string, executionTime: string, panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<IActionResult> {
    return getRawResult(apmDomainId, monitorId, monitorType, monitorName, vantagePoint, executionTime, "screenshot", "raw", panel, context);
}

export async function getLogs(apmDomainId: string, monitorId: string,
    vantagePoints: Array<VantagePointInfo>, outputChannel: vscode.OutputChannel,
    executionTime: string | undefined, vantagePoint: string | undefined): Promise<IActionResult> {
    return getResult(apmDomainId, monitorId, vantagePoints, "log", "zip", outputChannel, executionTime, vantagePoint);
}

export async function viewLogs(apmDomainId: string, monitorId: string, monitorType: string, monitorName: string,
    vantagePoint: string, executionTime: string, panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<IActionResult> {
    return getRawResult(apmDomainId, monitorId, monitorType, monitorName, vantagePoint, executionTime, "log", "raw", panel, context);
}

export async function getResult(apmDomainId: string, monitorId: string,
    vantagePoints: Array<VantagePointInfo>, resultType: string,
    resultContentType: string, outputChannel: vscode.OutputChannel,
    executionTime: string | undefined, vantagePoint: string | undefined): Promise<IActionResult> {
    try {
        if (executionTime === undefined || vantagePoint === undefined) {
            const monitorResultInfo = await getMonitorResultInfo(apmDomainId, vantagePoints);
            if (monitorResultInfo === undefined) {
                return newCancellation();
            }
            vantagePoint = monitorResultInfo.vantagePoint;
            executionTime = monitorResultInfo.executionTime;
        }
        const currentProfile = ext.api.getCurrentProfile();
        const r = await getMonitorResult(currentProfile.getProfileName(), apmDomainId, monitorId, vantagePoint!, resultType, resultContentType, executionTime!);
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

export async function getRawResult(apmDomainId: string, monitorId: string, monitorType: string, monitorName: string,
    vantagePoint: string, executionTime: string, resultType: string,
    resultContentType: string, panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<IActionResult> {
    try {
        const currentProfile = ext.api.getCurrentProfile();
        const r = await getMonitorResult(currentProfile.getProfileName(), apmDomainId, monitorId, vantagePoint, resultType, resultContentType, executionTime);
        if (r === undefined) {
            return newCancellation();
        }
        var resultDataSet = r.resultDataSet;
        if (resultDataSet === undefined) {
            vscode.window.showErrorMessage(localize('resultDataSetNotFound', 'Error: result data set not found, cancelling operation'));
            return newCancellation();
        }
        var utcDate = new Date(parseInt(executionTime, 10));
        var utcFormattedDate = formatDateUiUTC(utcDate);
        let fileNames: string[] = [];
        switch (resultType) {
            case 'diagnostics':
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
                panel.webview.html = ViewOutput(panel.webview, context.extensionUri, "", outputText);
                break;
            case 'screenshot':
                resultDataSet = sortScreenshotList(resultDataSet);
                var nameToResultsetMap;
                try {
                    nameToResultsetMap = new Map(resultDataSet!
                        .filter(r => r && r.name !== undefined && r.byteContent !== undefined)
                        .map(r => [r.name!.toString(), r]));

                    fileNames = Array.from(nameToResultsetMap.keys());
                    fileNames.push('All');
                    // Convert Map to object to pas to webview
                    const mapObject = Object.fromEntries(nameToResultsetMap);
                    panel.webview.html = ViewScreenshots(panel.webview, context.extensionUri,
                        "<b>Monitor</b>: " + monitorName + "<br><br><b>Timestamp</b>: " + executionTime + "<br><br><b>Time (UTC)</b>: " + utcFormattedDate +
                        "<br><br><b>Vantagepoint</b>: " + vantagePoint + "", JSON.stringify(fileNames), mapObject, vantagePoint, executionTime);
                    // For large data we cannot pass object directly in above call, hence we need to separately call the postmessage function
                    // panel.webview.postMessage({
                    //     type: 'imagesData',
                    //     payload: mapObject
                    // });
                } catch (e) {
                    vscode.window.showErrorMessage(localize('resultDataSetNotFound', 'Error: result data set not found, cancelling operation'));
                    return newCancellation();
                }
                break;
            case 'har':
                var nameToStringContentMap;
                try {
                    nameToStringContentMap = new Map(resultDataSet!
                        .filter(r => r && r.name !== undefined && r.stringContent !== undefined && r.name !== "Marker/CustomMarker.json")
                        .map(r => [r.name!.toString(), r.stringContent]));

                    fileNames = Array.from(nameToStringContentMap.keys());
                    panel.webview.html = ViewHar(panel.webview, context.extensionUri,
                        "<b>Monitor</b>: " + monitorName + "<br><br><b>Timestamp</b>: " + executionTime + "<br><br><b>Time (UTC)</b>: " + utcFormattedDate +
                        "<br><br><b>Vantagepoint</b>: " + vantagePoint + "", JSON.stringify(fileNames), Object.fromEntries(nameToStringContentMap), vantagePoint, executionTime);
                } catch (e) {
                    vscode.window.showErrorMessage(localize('resultDataSetNotFound', 'Error: result data set not found, cancelling operation'));
                    return newCancellation();
                }
                break;
            // commenting for type 'log' as api only supports 'zip' content type for log and not type 'raw'      
            // case 'log':
            //     let errorContent = '[]';
            //     let logContent = '[]';
            //     try {
            //         for (let i = 0; i < resultDataSet.length; i++) {
            //             if (resultDataSet[i] !== undefined && resultDataSet[i].name !== undefined && resultDataSet[i].stringContent !== undefined) {
            //                 if (resultDataSet[i].name === 'error.log') {
            //                     errorContent = (resultDataSet[i].stringContent === undefined) ? '[]' : resultDataSet[i].stringContent!;
            //                 } else {
            //                     logContent = (resultDataSet[i].stringContent === undefined) ? '[]' : resultDataSet[i].stringContent!;
            //                 }
            //                 fileNames[i] = resultDataSet[i].name!;
            //             }
            //         };
            //         const selectedFileName = await promptForFileNames(fileNames);
            //         if (selectedFileName === undefined) {
            //             return newCancellation();
            //         }
            //         panel.webview.html = ViewLogs(panel.webview, context.extensionUri,
            //             "Logs (monitor: " + monitorName + ", timestamp: " + executionTime + ", time (UTC): " + utcFormattedDate +
            //             ", vantagepoint: " + vantagePoint + ")", selectedFileName, errorContent, logContent);
            //     } catch (e) {
            //         vscode.window.showErrorMessage(localize('resultDataSetNotFound', 'Error: result data set not found, cancelling operation'));
            //         return newCancellation();
            //     }
            //     break;
            default:
                vscode.window.showErrorMessage(localize('incorrectResultType', 'Error: incorrect result type found'));
                return newCancellation();
        }

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

// sort screenshots in ascending order
export const sortScreenshotList = (screenshotArray: any[]): any => {
    screenshotArray.map((item: any) => {
        const nameWithoutExt = item.name.split(".");
        item.time = nameWithoutExt[0].includes("img") ? nameWithoutExt[0].slice(3) : nameWithoutExt[0];
    });
    screenshotArray.sort((a, b) => (a.time < b.time ? -1 : 1));
    return screenshotArray;
};

export async function getMonitorDetails(monitorId: string, apmDomainId: string,
    panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<IActionResult> {
    const currentProfile = ext.api.getCurrentProfile().getProfileName();
    const r = getMonitorDetailsInOutput(apmDomainId, monitorId, currentProfile, panel, context);
    return newSuccess(r);
}

export async function viewHarWebview(currentPanel: vscode.WebviewPanel | undefined, apmDomainId: string,
    monitorId: string, monitorType: string, monitorName: string, vp: string, timestamp: string, context: vscode.ExtensionContext) {
    let panel = vscode.window.createWebviewPanel("viewOutput", "HAR", vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    currentPanel = panel;
    let r = await viewHar(apmDomainId!, monitorId, monitorType, monitorName, vp, timestamp, panel, context);
    if (r.canceled) {
        currentPanel.dispose();
        currentPanel = undefined;
        return newCancellation();
    }
    panel.webview.onDidReceiveMessage(async (message: {
        command: any, timestamp: string, vp: any, status: boolean
    }) => {
        switch (message.command) {
            case 'download':
                const result = await getMonitorResult(ext.api.getCurrentProfile().getProfileName(),
                    apmDomainId, monitorId, message.vp, "har", "zip", message.timestamp);
                if (result === undefined) {
                    //currentPanel.dispose();
                    currentPanel = undefined;
                    return;
                }
                const resultDataSet = result.resultDataSet;
                if (resultDataSet === undefined) {
                    vscode.window.showErrorMessage(localize('resultDataSetNotFound', 'Error: result data set not found, cancelling operation'));
                    currentPanel = undefined;
                    return;
                }
                const content = resultDataSet[0].byteContent ?? '';
                if (content === undefined || content === '') {
                    vscode.window.showErrorMessage(localize('fileContentNotFound', 'Error: file content not found, cancelling operation'));
                    currentPanel = undefined;
                }
                const fileName = resultDataSet[0].name;
                if (fileName === undefined) {
                    vscode.window.showErrorMessage(localize('fileNotFound', 'Error: file name not found, cancelling operation'));
                    currentPanel = undefined;
                }
                currentPanel = panel;
                currentPanel.webview.postMessage({ command: 'download_hars', content: content, fileName: fileName });
                break;
            case 'download_complete':
                if (message.status) {
                    vscode.window.showInformationMessage(localize('fileDownloadSuccess', 'Har file download is starting...'));
                } else {
                    vscode.window.showErrorMessage(localize('fileDownloadFailure', 'Error: Unable to download har file.'));
                }
                break;
            case 'cancel':
                const operationCancelledMessage = localize("downloadHarCancelledMessage", 'Download HAR operation was cancelled.');
                vscode.window.showWarningMessage(
                    operationCancelledMessage, { modal: false }
                );
                panel.dispose();
                break;
        }
    },
        undefined,
        context.subscriptions
    );

    panel.onDidDispose(() => {
        currentPanel = undefined;
    });

}

export async function viewScreenshotWebview(currentPanel: vscode.WebviewPanel | undefined, apmDomainId: string,
    monitorId: string, monitorType: string, monitorName: string, vp: string, timestamp: string, context: vscode.ExtensionContext) {
    if (!(monitorType === "BROWSER" || monitorType === "SCRIPTED_BROWSER")) {
        vscode.window.showErrorMessage(localize('viewScreenshotNotSupported', 'View Screenshot option not supported for this monitor type'));
        return newCancellation();
    }
    let panel = vscode.window.createWebviewPanel("viewOutput", "Screenshots", vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    currentPanel = panel;
    let r = await viewScreenshots(apmDomainId!, monitorId, monitorType, monitorName, vp, timestamp, panel, context);
    if (r.canceled) {
        currentPanel.dispose();
        currentPanel = undefined;
        return newCancellation();
    }
    panel.webview.onDidReceiveMessage(async (message: {
        command: any; timestamp: string, vp: any, status: boolean
    }) => {
        switch (message.command) {
            case 'download':
                const result = await getMonitorResult(ext.api.getCurrentProfile().getProfileName(),
                    apmDomainId, monitorId, message.vp, "screenshot", "zip", message.timestamp);
                if (result === undefined) {
                    //currentPanel.dispose();
                    currentPanel = undefined;
                    return;
                }
                const resultDataSet = result.resultDataSet;
                if (resultDataSet === undefined) {
                    vscode.window.showErrorMessage(localize('resultDataSetNotFound', 'Error: result data set not found, cancelling operation'));
                    currentPanel = undefined;
                    return;
                }

                const content = resultDataSet[0].byteContent ?? '';
                if (content === undefined || content === '') {
                    vscode.window.showErrorMessage(localize('fileContentNotFound', 'Error: file content not found, cancelling operation'));
                    currentPanel = undefined;
                }
                const fileName = resultDataSet[0].name;
                if (fileName === undefined) {
                    vscode.window.showErrorMessage(localize('fileNotFound', 'Error: file name not found, cancelling operation'));
                    currentPanel = undefined;
                }
                currentPanel = panel;
                currentPanel.webview.postMessage({ command: 'download_screenshots', content: content, fileName: fileName });
                break;
            case 'download_complete':
                if (message.status) {
                    vscode.window.showInformationMessage(localize('fileDownloadSuccess', 'Screenshot file download is starting...'));
                } else {
                    vscode.window.showErrorMessage(localize('fileDownloadFailure', 'Error: Unable to download screenshot file.'));
                }
                break;
            case 'cancel':
                const operationCancelledMessage = localize("screenshotDownloadCancelledMessage", 'Screenshot download operation was cancelled.');
                vscode.window.showWarningMessage(
                    operationCancelledMessage, { modal: false }
                );
                panel.dispose();
                break;
        }
    },
        undefined,
        context.subscriptions
    );

    panel.onDidDispose(() => {
        currentPanel = undefined;
    });
}

export async function viewErrorMessageWebview(currentPanel: vscode.WebviewPanel | undefined, apmDomainId: string,
    monitorId: string, monitorType: string, monitorName: string, vp: string, timestamp: string, context: vscode.ExtensionContext) {
    let panel = vscode.window.createWebviewPanel("viewOutput", "Error Message", vscode.ViewColumn.One, {
        enableScripts: true,
        retainContextWhenHidden: true
    });
    currentPanel = panel;
    let r = await viewErrorMessage(apmDomainId!, monitorId, monitorType, monitorName, vp, timestamp, panel, context);
    if (r.canceled) {
        currentPanel.dispose();
        currentPanel = undefined;
    }
    panel.onDidDispose(() => {
        currentPanel = undefined;
    });
}


