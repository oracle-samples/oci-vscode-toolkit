/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import { MonitoringClient } from "oci-monitoring";
import { MetricData } from "oci-monitoring/lib/model";
import { clientConfiguration, getAuthProvider } from "./common";
import { ViewOutput } from '../webViews/ViewOutput';

async function makeClient(profile: string): Promise<MonitoringClient> {
    return new MonitoringClient({
        authenticationDetailsProvider: await getAuthProvider(profile),
    }, clientConfiguration);
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

export async function getMonitorExecutionResults(profile: string, monitorId: string, monitorName: string, compartmentId: string,
    panel: vscode.WebviewPanel, context: vscode.ExtensionContext, startDate: Date, endDate: Date) {
    const localize: nls.LocalizeFunc = nls.loadMessageBundle();
    var headerText = localize('msg', 'Monitor execution results for monitor: {0} from start date: {1} to end date: {2}', monitorName, startDate.toString(), endDate.toString());
    var outputText = '';
    var execTimeDataPoints = await getMetricDataPoints(startDate, endDate, 'MonitorExecutionTime', monitorId, compartmentId, profile);
    if (execTimeDataPoints.length == 0) {
        outputText = outputText + '\n' + localize('monitorExecResultsMsg', 'No result found');
    }
    for (const execTimeMetric of execTimeDataPoints) {
        var availabilityDataPoints = await getMetricDataPoints(startDate, endDate, 'Availability', monitorId, compartmentId, profile);
        for (const availabilityMetric of availabilityDataPoints) {
            if (JSON.stringify(availabilityMetric.dimensions) === JSON.stringify(execTimeMetric.dimensions)) {
                availabilityMetric.aggregatedDatapoints.forEach(a => execTimeMetric.aggregatedDatapoints.some((e) => {
                    if (e.timestamp === a.timestamp) {
                        const timestamp = new Date(e.timestamp).getTime();
                        outputText = outputText + '\n\n\n' + localize('monitorExecResultsMsg', "Availability: {0} \nMonitor Execution Time (ms): {1} \nTimestamp (UTC): {2} \nTimestamp (epoch): {3} \nVantage Point: {4} \nError Category: {5}",
                            a.value, e.value, e.timestamp.toString(), timestamp, availabilityMetric.dimensions["VantagePoint"], availabilityMetric.dimensions["ErrorCategory"]);
                    }
                }));
            }
        }
    }
    panel.webview.html = ViewOutput(panel.webview, context.extensionUri,
        headerText, outputText);
}