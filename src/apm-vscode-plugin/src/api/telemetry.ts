/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { MonitoringClient } from "oci-monitoring";
import { clientConfiguration, getAuthProvider } from "./common";
import { ViewExecutionResults } from '../webViews/ViewExecutionResults';
import { viewErrorMessageWebview, viewHarWebview, viewScreenshotWebview } from '../ui/commands/monitorOperations/monitor-operations';
import { MetricData } from 'oci-monitoring/lib/model';

async function makeClient(profile: string): Promise<MonitoringClient> {
    return new MonitoringClient({
        authenticationDetailsProvider: await getAuthProvider(profile),
    }, clientConfiguration);
}

/** date shown on Result page */
export function formatDateUiUTC(dt: Date) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var date = new Date(dt.toUTCString());
    const DOW = days[date.getUTCDay()];
    const yyyy = date.getUTCFullYear();
    const MMM = months[date.getUTCMonth()];
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const HH = String(date.getUTCHours()).padStart(2, '0');
    const mm = String(date.getUTCMinutes()).padStart(2, '0');
    const ss = String(date.getUTCSeconds()).padStart(2, '0');

    return `${DOW}, ${MMM} ${dd}, ${yyyy} ${HH}:${mm}:${ss} UTC`;
}

export async function getMetricDataPoints(
    startDate: Date,
    endDate: Date,
    metricName: string,
    monitorId: string,
    compartmentId: string,
    profile: string
): Promise<MetricData[]> {
    var client = await makeClient(profile);
    var query = metricName + "[1m]{MonitorId = " + monitorId + "}.mean()";
    let resp = await client.summarizeMetricsData({ compartmentId, "summarizeMetricsDataDetails": { "namespace": "oracle_apm_synthetics", "query": query, "endTime": endDate, "startTime": startDate } });
    return resp.items;
};

export async function getMonitorExecutionResults(apmDomainId: string, profile: string, monitorId: string, monitorType: string, monitorName: string, compartmentId: string,
    panel: vscode.WebviewPanel, context: vscode.ExtensionContext, startDate: Date, endDate: Date) {
    const localize: nls.LocalizeFunc = nls.loadMessageBundle();
    var isViewScreenshotEnabled = false;
    if (monitorType === "BROWSER" || monitorType === "SCRIPTED_BROWSER") {
        isViewScreenshotEnabled = true;
    }
    var headerText = localize('msg', '<p>Monitor: {0} <br>Start date: {1} <br>End date: {2}</p>', monitorName, formatDateUiUTC(startDate), formatDateUiUTC(endDate));
    var tableItems = '<table id="monitor-exec-results"><tr><th>Vantage Point</th><th>Availability</th><th>Total Completion Time (sec)</th><th>Time (UTC)</th>' +
        '<th>Timestamp (epoch)</th><th>Error Category</th><th>View HAR</th><th>View Screenshots</th><th>View Error Message</th></tr>';
    var execTimeDataPoints = await getMetricDataPoints(startDate, endDate, 'MonitorExecutionTime', monitorId, compartmentId, profile);
    if (execTimeDataPoints.length == 0) {
        // outputText = outputText + '\n' + localize('monitorExecResultsMsg', 'No result found');
        tableItems = '<table><tr><td>No result found</td></tr>';
    }
    var resultCount: number = 0;
    var available: string;
    for (const execTimeMetric of execTimeDataPoints) {
        var availabilityDataPoints = await getMetricDataPoints(startDate, endDate, 'Availability', monitorId, compartmentId, profile);
        for (const availabilityMetric of availabilityDataPoints) {
            if (JSON.stringify(availabilityMetric.dimensions) === JSON.stringify(execTimeMetric.dimensions)) {
                availabilityMetric.aggregatedDatapoints.forEach(a => execTimeMetric.aggregatedDatapoints.some((e) => {
                    if (e.timestamp === a.timestamp) {
                        resultCount++;
                        if (a.value === 1) {
                            available = ' style="color:green" >Available';
                        } else {
                            available = ' style="color:red" >Unavailable';
                        }
                        const timestamp = new Date(e.timestamp).getTime();
                        let execTime: number = (e.value / 1000);
                        let isErrorAvailable = (a.value === 1 ? false : true);
                        tableItems = tableItems + '<tr><td>' + availabilityMetric.dimensions["VantagePoint"] + '</td><td' + available + '</td><td>' + execTime.toFixed(2) + '</td><td>' + e.timestamp.toString() + '</td><td>' +
                            timestamp + ' <button onclick="copyTextFunction(\'' + timestamp + '\')">Copy</button></td><td>' + availabilityMetric.dimensions["ErrorCategory"] +
                            '</td><td><button value="view-har" data-value-vp="' + availabilityMetric.dimensions["VantagePoint"] +
                            '" data-value-timestamp="' + timestamp + '" id="view-har-button-' + resultCount +
                            '">View</button></td><td><button value="view-screenshot" data-enabled=\'' + isViewScreenshotEnabled + '\' data-value-vp="' + availabilityMetric.dimensions["VantagePoint"] + '" data-value-timestamp="' + timestamp +
                            '" id="view-screenshot-button-' + resultCount + '">View</button></td><td><button value="view-error-message" data-enabled=\'' + isErrorAvailable + '\' data-value-vp="' + availabilityMetric.dimensions["VantagePoint"] + '" data-value-timestamp="' + timestamp +
                            '" id="view-error-message-button-' + resultCount + '">View</button></td></tr>';
                    }
                }));
            }
        }
    }
    // close table tag
    tableItems = tableItems + '</table>';
    panel.webview.html = ViewExecutionResults(panel.webview, context.extensionUri,
        headerText, tableItems, resultCount);
    panel.webview.onDidReceiveMessage(async (message: {
        command: any; vp: string, timestamp: string
    }) => {
        switch (message.command) {
            case 'view_screenshots':
                viewScreenshotWebview(panel, apmDomainId, monitorId, monitorType, monitorName, message.vp, message.timestamp, context);
                break;
            case 'view_har':
                viewHarWebview(panel, apmDomainId, monitorId, monitorType, monitorName, message.vp, message.timestamp, context);
                break;
            case 'view_error_message':
                viewErrorMessageWebview(panel, apmDomainId, monitorId, monitorType, monitorName, message.vp, message.timestamp, context);
                break;
            case 'cancel':
                const operationCancelledMessage = localize("monitorCancelledMessage", 'Get execution results operation was cancelled.');
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
}