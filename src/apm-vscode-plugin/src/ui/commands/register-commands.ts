/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import {
    CreateOCIAPMSynMonitor, ExpandCompartment, ListResource, ShowDocumentation, SignInItem,
    DeleteOCIAPMSynMonitor, FocusApmSyntheticPlugin, SwitchRegion,
    createFullCommandName, CreateOCIAPMSynScript, RunNowOCIAPMSynMonitor, GetAPMSynMonitorResults,
    CreateOCIAPMSynOnPremiseVantagePoint, CreateWorkerOCIAPMSynOnPremiseVantagePoint,
    GetAPMSynOnPremiseVantagePointResults, DeleteOCIAPMSynOnPremiseVantagePoint,
    DeleteOCIAPMSynScript,
    EditOCIAPMSynScript,
    CreateOCIAPMSynWorker, DownloadRestWorkerOCIAPMSynOPVP, DownloadSideWorkerOCIAPMSynOPVP,
    EditOCIAPMSynMonitor,
    GetAPMSynWorkerResults, DeleteOCIAPMSynWorker, DisableOCIAPMSynWorker, UpdatePriorityOCIAPMSynWorker,
    GetHar,
    GetScreenshots,
    GetLogs,
    Launch,
    DownloadOCIAPMSynScript,
    GetOCIAPMSynMonitorDetails,
    GetOCIAPMSynScriptDetails,
    ViewMonitorInBrowser,
    ViewScriptInBrowser,
    CopyScriptOCID,
    ListVantagePoints,
    CopyMonitorOCID,
    ViewErrorMessage
} from './resources';
import { ext } from '../../extensionVars';
import { IOCIProfileTreeDataProvider, IRootNode } from '../../oci-api';
import { IActionResult, isCanceled, hasFailed, newCancellation } from '../../utils/actionResult';
import { OCICompartmentNode } from "../tree/nodes/oci-compartment-node";
import path = require('path');
import { launchWorkFlow, revealTreeNode } from './launchWorkflow/launch';
import { isPayloadValid } from '../../common/validations/launchPayload';
import * as nls from 'vscode-nls';
import { METRIC_INVOCATION, } from 'oci-ide-plugin-base/dist/monitoring/monitoring';
import { Service } from 'oci-ide-plugin-base/dist/monitoring/service';
import { MONITOR } from '../../common/monitor';
import { listRecentCommands } from 'oci-ide-plugin-base/dist/extension/ui/features/command-manager';
import { executeUserCommand, _appendCommandInfo } from './ui/list-recent-commands';
import { RootNode } from '../tree/nodes/rootNode';
import {
    getHar, getLogs, getMonitorResultMetrics, webviewEditMonitor,
    getScreenshots, runNow, webviewCreateNewMonitor, webviewSaveMonitorJson,
    getMonitorDetails,
    viewErrorMessage
} from "./monitorOperations/monitor-operations";
import {
    deleteMonitor, deleteOnPremiseVantagePoint, deleteScript, deleteWorker,
    disableWorker, getScript, listScripts, updateWorkerPriority
} from '../../api/apmsynthetics';
import { MonitorsNode } from '../tree/nodes/monitors-node';
import { OCIApmSynMonitorSummaryNode } from '../tree/nodes/oci-apm-syn-monitor-summary-node';
import { getMonitor } from '../../api/apmsynthetics';
// OPVP
import { OnPremiseVantagePointsNode } from '../tree/nodes/opvps-node';
import { createNewOnPremiseVantagePoint, getOnPremiseVantagePointResults, downloadRestImage, downloadSideImage } from './opvpOperations/opvp-operations';
import { OCIApmOpvpNode } from '../tree/nodes/oci-apmSynOpvp-node';

// worker
import { WorkersNode } from '../tree/nodes/workers-node';
import { createNewWorker, createNewWorkerOpvp, getWorkerResults, updatePriority } from './workerOperations/worker-operations';
import { OCIApmSynWorkerSummaryNode } from '../tree/nodes/oci-apm-syn-worker-summary-node';
//script
import { ScriptsNode } from '../tree/nodes/scripts-node';
import { createNewScript, editScript, getScriptContent, getScriptDetails, webviewCreateNewScript, webviewEditNewScript } from './scriptOperations/script-operations';
import { OCIApmSynScriptSummaryNode } from '../tree/nodes/oci-apm-syn-script-summary-node';
import { CreateMonitorGetWebview } from '../../webViews/CreateMonitor';
import { EditMonitorGetWebview } from '../../webViews/EditMonitor';
import { CreateScriptGetWebview } from '../../webViews/CreateScript';
import { EditScriptGetWebview } from '../../webViews/EditScript';
import { getVPList, VantagePointItem } from './ui/get-monitor-info';
import { getScriptsList } from './ui/get-script-info';
import { Monitor, MonitorScriptParameterInfo, MonitorScriptParameter } from 'oci-apmsynthetics/lib/model';
import { ViewOutput } from '../../webViews/ViewOutput';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();
let currentPanel: vscode.WebviewPanel | undefined = undefined;
// Runs an action with status bar and progress image.
// It can also execute specified function on success or on cancelation.
function runWithStatusBarMessage(
    func: Promise<IActionResult>,
    message: string,
    onSucceeded?: (result: IActionResult) => void,
    onCanceled?: () => void,
    onFailed?: (result: IActionResult) => void,
) {
    const progressOptions = {
        location: vscode.ProgressLocation.Notification,
        title: message,
        cancellable: false,
    };

    return vscode.window.withProgress<IActionResult>(
        progressOptions,
        async (p: any) => {
            const disposable = vscode.window.setStatusBarMessage(message);
            const funcResult = await func;

            if (isCanceled(funcResult)) {
                if (onCanceled) {
                    onCanceled();
                }
                disposable.dispose();
                return funcResult;
            }

            if (hasFailed(funcResult)) {
                if (onFailed) {
                    onFailed(funcResult);
                }
                disposable.dispose();
                return funcResult;
            }

            if (onSucceeded) {
                onSucceeded(funcResult);
            }

            disposable.dispose();
            return funcResult;
        },
    );
}

export function registerCommands(
    context: vscode.ExtensionContext,
    dataProvider: IOCIProfileTreeDataProvider,
): void {
    const refreshNode = (node: RootNode | undefined): void => dataProvider.refresh(node);
    ext.api.onSignInCompleted(() => dataProvider.refresh(undefined));

    context.subscriptions.push(
        vscode.commands.registerCommand(SignInItem.commandName, async () => {
            _appendCommandInfo(SignInItem.commandName, undefined);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, SignInItem.commandName, undefined));
            const profileName = await vscode.window.withProgress<string | undefined>(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: true,
                },
                async (progress: any, token: any) => {
                    progress.report({
                        message: localize("signInChannelMessage", 'Signing in...')
                    });
                    return ext.api.signIn(undefined, undefined, token);
                },
            );
            if (profileName) {
                dataProvider.refresh(undefined);
            }
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            ListVantagePoints.commandName,
            async (node: MonitorsNode) => {
                _appendCommandInfo(ListVantagePoints.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ListVantagePoints.commandName, apmDomainId));
                let vpList: VantagePointItem[] = await getVPList(apmDomainId);
                if (currentPanel && currentPanel.viewType !== "viewOutput") {
                    currentPanel.dispose();
                }
                let panel = vscode.window.createWebviewPanel("viewOutput", "Vantage Points", vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                currentPanel = panel;
                let outputText = localize("viewOutput", "\n {0}", JSON.stringify(vpList, null, '\t'));
                panel.webview.html = ViewOutput(panel.webview, context.extensionUri,
                    "Vantage Points", outputText);

                panel.onDidDispose(() => {
                    currentPanel = undefined;
                });
            }
        ));


    context.subscriptions.push(
        vscode.commands.registerCommand(
            CreateOCIAPMSynMonitor.commandName,
            async (node: MonitorsNode) => {
                if (currentPanel && currentPanel.viewType !== "viewOutput") {
                    currentPanel.dispose();
                }
                _appendCommandInfo(CreateOCIAPMSynMonitor.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, CreateOCIAPMSynMonitor.commandName, apmDomainId));
                let vpList: VantagePointItem[] = await getVPList(apmDomainId);
                var stringifiedVpList = JSON.stringify(vpList);
                let scriptsList = await getScriptsList(apmDomainId);
                var stringifiedScriptsList = JSON.stringify(scriptsList);
                // const jsonTemplate = "{ \n \"displayName\": \"string\",\n \"monitorType\": \"SCRIPTED_BROWSER\",\n \"vantagePoints\": [\n  \"string\",\n  \"string\"\n ],\n " +
                //     " \"scriptId\": \"string\",\n \"status\": \"ENABLED\",\n \"repeatIntervalInSeconds\":300,\n \"isRunOnce\": false,\n \"timeoutInSeconds\": 60,\n " +
                //     " \"target\": \"string\",\n \"configuration\": {\n    \"configType\": \"SCRIPTED_BROWSER_CONFIG\",\n    \"isFailureRetried\": true,\n " +
                //     " \"dnsConfiguration\": {\n      \"isOverrideDns\": true,\n      \"overrideDnsIp\": \"string\"\n    },\n    \"isCertificateValidationEnabled\": true,\n " +
                //     "    \"isDefaultSnapshotEnabled\": true,\n    \"networkConfiguration\": {\n      \"numberOfHops\": 50,\n      \"probeMode\": \"SACK\",\n      \"probePerHop\": 3,\n " +
                //     "      \"protocol\": \"TCP\",\n      \"transmissionRate\": 16\n     }\n  },\n \"availabilityConfiguration\": {\n  \"maxAllowedFailuresPerInterval\": 0,\n " +
                //     "  \"minAllowedRunsPerInterval\": 1\n },\n \"maintenanceWindowSchedule\": {\n  \"timeEnded\": \"2017-01-01T00:00:00+00:00\",\n " +
                //     "  \"timeStarted\": \"2017-01-01T00:00:00+00:00\"\n },\n \n \n \"freeformTags\": {\n  \"tagKey1\": \"string\",\n  \"tagKey2\": \"string\"\n },\n\n \"definedTags\": {\n " +
                //     "  \"tagNamespace1\": {\n   \"tagKey1\": \"string\",\n   \"tagKey2\": \"string\"\n  },\n  \"tagNamespace2\": {\n   \"tagKey1\": \"string\",\n " +
                //     "  \"tagKey2\": \"string\"\n  }\n },\n\n \"scriptParameters\": [\n  {\n   \"paramName\": \"string\",\n   \"paramValue\": \"string\"\n  },\n " +
                //     "  {\n   \"paramName\": \"string\",\n   \"paramValue\": \"string\"\n  }\n ],\n\n \"isRunNow\": false,\n \"schedulingPolicy\": \"ALL\",\n " +
                //     "  \n}";

                let panel = vscode.window.createWebviewPanel("createMonitor", "Create Monitor", vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                currentPanel = panel;
                panel.webview.html = CreateMonitorGetWebview(panel.webview, context.extensionUri,
                    stringifiedVpList, stringifiedScriptsList, apmDomainId!);
                panel.webview.onDidReceiveMessage(async (message: {
                    command: any; vantagePoint: any; monitorName: any;
                    target: any; scriptId: any; monitorJson: any
                }) => {
                    switch (message.command) {
                        case 'create_monitor':
                            let r = await runWithStatusBarMessage(
                                webviewCreateNewMonitor(apmDomainId!, message.monitorJson, panel),
                                localize('createMonitorMessage', 'Creating new monitor...'),
                                () => refreshNode(undefined)
                            );
                            let response = r.result;
                            // Display monitor response on webview
                            let responsePanel = vscode.window.createWebviewPanel("viewOutput", "Create Monitor Response", vscode.ViewColumn.One, {
                                enableScripts: true,
                                retainContextWhenHidden: true
                            });
                            currentPanel = responsePanel;
                            let outputText = localize("viewOutput", "\n {0}", JSON.stringify(response, null, '\t'));
                            responsePanel.webview.html = ViewOutput(responsePanel.webview, context.extensionUri,
                                "Create Monitor Response", outputText);
                            break;
                        case 'save_as_json':
                            runWithStatusBarMessage(
                                webviewSaveMonitorJson(message.monitorName, message.monitorJson, panel, node.getOutputChannel()),
                                localize('saveMonitorMessage', 'Saving json template...'),
                                () => refreshNode(node)
                            );
                            break;
                        case 'cancel':
                            const operationCancelledMessage = localize("monitorCancelledMessage", 'Monitor creation operation was cancelled.');
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
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            RunNowOCIAPMSynMonitor.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(RunNowOCIAPMSynMonitor.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, RunNowOCIAPMSynMonitor.commandName, apmDomainId));

                return runWithStatusBarMessage(
                    runNow(apmDomainId!, node.getMonitorId(), node.getMonitorStatus()),
                    localize('runNowMonitorMessage', 'Running monitor now, wait for few minutes to get results...'),
                    () => refreshNode(node)
                );
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            GetAPMSynMonitorResults.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(GetAPMSynMonitorResults.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, GetAPMSynMonitorResults.commandName, apmDomainId));

                if (currentPanel && currentPanel.viewType !== "viewOutput") {
                    currentPanel.dispose();
                }
                let panel = vscode.window.createWebviewPanel("viewOutput", "Execution Results", vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                currentPanel = panel;
                let r = await getMonitorResultMetrics(node.getMonitorId(), node.getMonitorName(), node.getCompartmentId(), panel, context);
                if (r.canceled) {
                    currentPanel.dispose();
                    currentPanel = undefined;
                }
                panel.onDidDispose(() => {
                    currentPanel = undefined;
                });
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            EditOCIAPMSynMonitor.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                if (currentPanel && currentPanel.viewType !== "viewOutput") {
                    currentPanel.dispose();
                }
                _appendCommandInfo(EditOCIAPMSynMonitor.commandName, node);
                const apmDomainId = node.getApmDomainId();
                const monitorId = node.getMonitorId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, EditOCIAPMSynMonitor.commandName, apmDomainId));

                let vpList: VantagePointItem[] = await getVPList(apmDomainId);
                var stringifiedVpList = JSON.stringify(vpList);
                let scriptsList = await getScriptsList(apmDomainId);
                var stringifiedScriptsList = JSON.stringify(scriptsList);
                let vpNameSel: string = '';
                node.synMonSummary.vantagePoints.forEach((item) => {
                    vpNameSel = vpNameSel.concat(item.name + ',');
                });
                let panel = vscode.window.createWebviewPanel("editMonitor", "Edit Monitor", vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                currentPanel = panel;
                const profile = ext.api.getCurrentProfile().getProfileName();
                const monitor: Monitor = await getMonitor(apmDomainId, monitorId, profile);
                // Stringify and then parse monitor resp so as to convert type of updatedMonitor variable to JSON from type Monitor.
                // This is done to process/unset some of the fields.
                let updatedMonitor = JSON.parse(JSON.stringify(monitor));
                if (updatedMonitor.scriptParameters === undefined || updatedMonitor.scriptParameters.length === 0) {
                    updatedMonitor["scriptParameters"] = undefined;
                } else {
                    const scriptParameters: MonitorScriptParameterInfo[] = updatedMonitor?.scriptParameters;
                    let scriptParams: MonitorScriptParameter[] = [];
                    scriptParameters.forEach((param, index) => {
                        scriptParams.push(param?.monitorScriptParameter);
                    });
                    updatedMonitor["scriptParameters"] = scriptParams;
                }
                updatedMonitor["vantagePoints"] = monitor.vantagePoints.map(vp => vp.name);
                updatedMonitor["id"] = undefined;
                updatedMonitor["vantagePointCount"] = undefined;
                updatedMonitor["monitorType"] = undefined;
                updatedMonitor["scriptName"] = undefined;
                updatedMonitor["timeCreated"] = undefined;
                updatedMonitor["timeUpdated"] = undefined;
                updatedMonitor["createdBy"] = undefined;
                updatedMonitor["lastUpdatedBy"] = undefined;
                updatedMonitor["batchIntervalInSeconds"] = undefined;
                updatedMonitor["isIPv6"] = undefined;

                panel.webview.html = EditMonitorGetWebview(panel.webview, context.extensionUri,
                    stringifiedVpList, stringifiedScriptsList, vpNameSel, monitor, updatedMonitor, apmDomainId!);
                panel.webview.onDidReceiveMessage(async (message: {
                    command: any; apmDomainId: any; monitorId: any; monitorName: any, monitorJson: any
                }) => {
                    switch (message.command) {
                        case 'edit_monitor':
                            let r = await runWithStatusBarMessage(
                                webviewEditMonitor(apmDomainId!, monitorId!, message.monitorJson, panel),
                                localize('editMonitorMessage', 'Updating monitor...'),
                                () => refreshNode(undefined)
                            );
                            let response = r.result;
                            // Display monitor response on webview
                            let responsePanel = vscode.window.createWebviewPanel("viewOutput", "Edit Monitor Response", vscode.ViewColumn.One, {
                                enableScripts: true,
                                retainContextWhenHidden: true
                            });
                            currentPanel = responsePanel;
                            let outputText = localize("viewOutput", "\n {0}", JSON.stringify(response, null, '\t'));
                            responsePanel.webview.html = ViewOutput(responsePanel.webview, context.extensionUri,
                                "Edit Monitor Response", outputText);
                            break;
                        case 'save_as_json':
                            runWithStatusBarMessage(
                                webviewSaveMonitorJson(message.monitorName, message.monitorJson, panel, node.getOutputChannel()),
                                localize('saveMonitorMessage', 'Saving json template...'),
                                () => refreshNode(node)
                            );
                            break;
                        case 'cancel':
                            const operationCancelledMessage = localize("monitorCancelledMessage", 'Monitor edit operation was cancelled.');
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
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            DeleteOCIAPMSynMonitor.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(DeleteOCIAPMSynMonitor.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, DeleteOCIAPMSynMonitor.commandName, apmDomainId));

                const profile = ext.api.getCurrentProfile().getProfileName();
                const prompt = localize('deleteAPMSynMonConfirmation', 'Confirm to delete monitor?');
                const yes = localize('yes', 'Yes');
                const no = localize('no', 'No');
                const answer = await vscode.window.showInformationMessage(prompt, yes, no);
                if (answer === yes) {
                    const result = await deleteMonitor(profile, node.getApmDomainId(), node.getMonitorId());
                    if (result) {
                        const deleteMessage = localize("deleteAPMSynMonMessage", 'Monitor is deleted.');
                        vscode.window.showWarningMessage(deleteMessage, { modal: false });
                    }
                    ext.treeDataProvider.refresh(undefined);
                }
            }
        ));


    context.subscriptions.push(
        vscode.commands.registerCommand(
            ViewErrorMessage.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(ViewErrorMessage.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ViewErrorMessage.commandName, apmDomainId));
                if (currentPanel !== undefined && currentPanel.viewType !== "viewOutput") {
                    currentPanel.dispose();
                }
                let panel = vscode.window.createWebviewPanel("viewOutput", "Error Message", vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                currentPanel = panel;
                let r = await viewErrorMessage(apmDomainId!, node.getMonitorId(), node.getMonitorType(), node.getVantagePoints(), panel, context);
                if (r.canceled) {
                    currentPanel.dispose();
                    currentPanel = undefined;
                }
                panel.onDidDispose(() => {
                    currentPanel = undefined;
                });
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            GetHar.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(GetHar.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, GetHar.commandName, apmDomainId));
                return runWithStatusBarMessage(
                    getHar(apmDomainId!, node.getMonitorId(), node.getVantagePoints(), node.getOutputChannel()),
                    localize('getHarMessage', 'Downloading HAR...'),
                    () => refreshNode(node)
                );
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            GetScreenshots.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(GetScreenshots.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, GetScreenshots.commandName, apmDomainId));
                return runWithStatusBarMessage(
                    getScreenshots(apmDomainId!, node.getMonitorId(), node.getVantagePoints(), node.getOutputChannel()),
                    localize('getScreenshotsMessage', 'Downloading Screenshots...'),
                    () => refreshNode(undefined)
                );
            }
        ));


    context.subscriptions.push(
        vscode.commands.registerCommand(
            GetLogs.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(GetLogs.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, GetLogs.commandName, apmDomainId));
                return runWithStatusBarMessage(
                    getLogs(apmDomainId!, node.getMonitorId(), node.getVantagePoints(), node.getOutputChannel()),
                    localize('getLogsMessage', 'Downloading Logs...'),
                    () => refreshNode(node)
                );
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            GetOCIAPMSynMonitorDetails.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(GetOCIAPMSynMonitorDetails.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, GetOCIAPMSynMonitorDetails.commandName, apmDomainId));
                if (currentPanel && currentPanel.viewType !== "viewOutput") {
                    currentPanel.dispose();
                }
                let panelTitle = "Monitor Details: " + node.getMonitorName();
                let panel = vscode.window.createWebviewPanel("viewOutput", panelTitle, vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                currentPanel = panel;
                getMonitorDetails(node.getMonitorId(), apmDomainId!, panel, context);
                panel.onDidDispose(() => {
                    currentPanel = undefined;
                });
            }
        ));


    context.subscriptions.push(
        vscode.commands.registerCommand(
            ViewMonitorInBrowser.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(ViewMonitorInBrowser.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ViewMonitorInBrowser.commandName, apmDomainId));
                const consoleUrl = node.getConsoleUrl(ext.api.getCurrentProfile().getRegionName());
                await vscode.env.openExternal(vscode.Uri.parse(await consoleUrl));
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CopyMonitorOCID.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(CopyMonitorOCID.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, CopyMonitorOCID.commandName, apmDomainId));
                const monitorId = node.getMonitorId();
                await vscode.env.clipboard.writeText(monitorId);
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CreateOCIAPMSynScript.commandName,
            async (node: ScriptsNode) => {
                if (currentPanel && currentPanel.viewType !== "viewOutput") {
                    currentPanel.dispose();
                }
                _appendCommandInfo(CreateOCIAPMSynScript.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, CreateOCIAPMSynScript.commandName, apmDomainId));
                let panel = vscode.window.createWebviewPanel("createScript", "Create Script", vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                currentPanel = panel;
                panel.webview.html = CreateScriptGetWebview(panel.webview, context.extensionUri);
                panel.webview.onDidReceiveMessage(async (message: { command: any; scriptName: any; scriptContent: any; scriptFileName: any }) => {
                    switch (message.command) {
                        case 'create_script':
                            let r = await runWithStatusBarMessage(
                                webviewCreateNewScript(apmDomainId!, message.scriptName, message.scriptContent, message.scriptFileName, panel),
                                localize('createScriptMessage', 'Creating new script...'),
                                () => refreshNode(undefined)
                            );
                            let response = r.result;
                            // Display script response on webview
                            let responsePanel = vscode.window.createWebviewPanel("viewOutput", "Create Script Response", vscode.ViewColumn.One, {
                                enableScripts: true,
                                retainContextWhenHidden: true
                            });
                            currentPanel = responsePanel;
                            let outputText = localize("viewOutput", "\n {0}", JSON.stringify(response, null, '\t'));
                            responsePanel.webview.html = ViewOutput(responsePanel.webview, context.extensionUri,
                                "Create Script Response", outputText);
                            break;
                        case 'cancel':
                            const operationCancelledMessage = localize("scriptCancelledMessage", 'Script create operation was cancelled.');
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
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            DownloadOCIAPMSynScript.commandName,
            async (node: OCIApmSynScriptSummaryNode) => {
                _appendCommandInfo(DownloadOCIAPMSynScript.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, DownloadOCIAPMSynScript.commandName, apmDomainId));
                return runWithStatusBarMessage(
                    getScriptContent(apmDomainId!, node.getScriptId(), node.getOutputChannel()),
                    localize('getScriptMessage', 'Downloading script content ...'),
                    () => refreshNode(undefined)
                );
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            EditOCIAPMSynScript.commandName,
            async (node: OCIApmSynScriptSummaryNode) => {
                if (currentPanel && currentPanel.viewType !== "viewOutput") {
                    currentPanel.dispose();
                }
                _appendCommandInfo(EditOCIAPMSynScript.commandName, node);
                const apmDomainId = node.getApmDomainId();
                const scriptId = node.getScriptId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, EditOCIAPMSynScript.commandName, apmDomainId));

                const profile = ext.api.getCurrentProfile().getProfileName();
                const scriptDetails = await getScript(profile, apmDomainId!, scriptId);
                const scriptContent = scriptDetails.content;
                if (scriptContent === undefined) {
                    vscode.window.showErrorMessage(localize('scriptContentNotFound', 'Script content not found, cancelling operation'));
                    node.getOutputChannel().appendLine(localize('scriptContentNotFound', 'Script content not found, cancelling operation'));
                    return newCancellation();
                }
                const scriptContentEncoded = btoa(JSON.stringify(scriptContent));

                let panel = vscode.window.createWebviewPanel("editScript", "Edit Script", vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                currentPanel = panel;

                panel.webview.html = EditScriptGetWebview(panel.webview, context.extensionUri, node.synScriptSummary.displayName, node.synScriptSummary.id, scriptContentEncoded);
                panel.webview.onDidReceiveMessage(async (message: { command: any; scriptName: any; scriptContent: any; }) => {
                    switch (message.command) {
                        case 'edit_script':
                            let r = await runWithStatusBarMessage(
                                webviewEditNewScript(apmDomainId!, message.scriptName, scriptId!, message.scriptContent, panel),
                                localize('editScriptMessage', 'Editing script...'),
                                () => refreshNode(undefined)
                            );
                            let response = r.result;
                            // Display script response on webview
                            let responsePanel = vscode.window.createWebviewPanel("viewOutput", "Edit Script Response", vscode.ViewColumn.One, {
                                enableScripts: true,
                                retainContextWhenHidden: true
                            });
                            currentPanel = responsePanel;
                            let outputText = localize("viewOutput", "\n {0}", JSON.stringify(response, null, '\t'));
                            responsePanel.webview.html = ViewOutput(responsePanel.webview, context.extensionUri,
                                "Edit Script Response", outputText);
                            break;
                        case 'cancel':
                            const operationCancelledMessage = localize("scriptCancelledMessage", 'Edit script operation was cancelled.');
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
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            DeleteOCIAPMSynScript.commandName,
            async (node: OCIApmSynScriptSummaryNode) => {
                _appendCommandInfo(DeleteOCIAPMSynScript.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, DeleteOCIAPMSynScript.commandName, apmDomainId));

                const profile = ext.api.getCurrentProfile().getProfileName();
                const prompt = localize('deleteAPMSynScriptConfirmation', 'Confirm to delete script?');
                const yes = localize('yes', 'Yes');
                const no = localize('no', 'No');
                const answer = await vscode.window.showInformationMessage(prompt, yes, no);
                if (answer === yes) {
                    const result = await deleteScript(profile, node.getApmDomainId(), node.getScriptId());
                    if (result) {
                        const deleteMessage = localize("deleteAPMSynScriptMessage", 'Script is deleted.');
                        vscode.window.showWarningMessage(deleteMessage, { modal: false });
                    }
                    ext.treeDataProvider.refresh(undefined);
                }
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            GetOCIAPMSynScriptDetails.commandName,
            async (node: OCIApmSynScriptSummaryNode) => {
                _appendCommandInfo(GetOCIAPMSynScriptDetails.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, GetOCIAPMSynScriptDetails.commandName, apmDomainId));

                if (currentPanel && currentPanel.viewType !== "viewOutput") {
                    currentPanel.dispose();
                }
                let panelTitle = "Script Details: " + node.getScriptName();
                let panel = vscode.window.createWebviewPanel("viewOutput", panelTitle, vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                currentPanel = panel;
                getScriptDetails(node.getScriptId(), node.getApmDomainId(), panel, context);
                panel.onDidDispose(() => {
                    currentPanel = undefined;
                });
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            ViewScriptInBrowser.commandName,
            async (node: OCIApmSynScriptSummaryNode) => {
                _appendCommandInfo(ViewScriptInBrowser.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ViewScriptInBrowser.commandName, apmDomainId));
                const consoleUrl = node.getConsoleUrl(ext.api.getCurrentProfile().getRegionName());
                await vscode.env.openExternal(vscode.Uri.parse(await consoleUrl));
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CopyScriptOCID.commandName,
            async (node: OCIApmSynScriptSummaryNode) => {
                _appendCommandInfo(CopyScriptOCID.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, CopyScriptOCID.commandName, apmDomainId));
                const scriptId = node.getScriptId();
                await vscode.env.clipboard.writeText(scriptId);
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CreateOCIAPMSynOnPremiseVantagePoint.commandName,
            async (node: OnPremiseVantagePointsNode) => {
                _appendCommandInfo(CreateOCIAPMSynOnPremiseVantagePoint.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, CreateOCIAPMSynOnPremiseVantagePoint.commandName, apmDomainId));
                return runWithStatusBarMessage(
                    createNewOnPremiseVantagePoint(apmDomainId!),
                    localize('createOpvpMessage', 'Creating new on premise vantage point...'),
                    () => refreshNode(undefined)
                );
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            DownloadRestWorkerOCIAPMSynOPVP.commandName,
            async (node: OnPremiseVantagePointsNode) => {
                _appendCommandInfo(DownloadRestWorkerOCIAPMSynOPVP.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, DownloadRestWorkerOCIAPMSynOPVP.commandName, apmDomainId));
                return runWithStatusBarMessage(
                    downloadRestImage(apmDomainId!, node.getOutputChannel()),
                    localize('downloadRestImage', 'Downloading non-browser worker ...'),
                    () => refreshNode(node)
                );
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            DownloadSideWorkerOCIAPMSynOPVP.commandName,
            async (node: OnPremiseVantagePointsNode) => {
                _appendCommandInfo(DownloadSideWorkerOCIAPMSynOPVP.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, DownloadSideWorkerOCIAPMSynOPVP.commandName, apmDomainId));
                return runWithStatusBarMessage(
                    downloadSideImage(apmDomainId!, node.getOutputChannel()),
                    localize('downloadSideImage', 'Downloading browser worker ...'),
                    () => refreshNode(node)
                );
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CreateWorkerOCIAPMSynOnPremiseVantagePoint.commandName,
            async (node: OnPremiseVantagePointsNode) => {
                _appendCommandInfo(CreateWorkerOCIAPMSynOnPremiseVantagePoint.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, CreateWorkerOCIAPMSynOnPremiseVantagePoint.commandName, apmDomainId));
                return runWithStatusBarMessage(
                    createNewWorkerOpvp(apmDomainId!, "", node.getOutputChannel()),
                    localize('createWorkerOpvpMessage', 'Generating worker usage instruction...'),
                    () => refreshNode(undefined)
                );
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            GetAPMSynOnPremiseVantagePointResults.commandName,
            async (node: OCIApmOpvpNode) => {

                _appendCommandInfo(GetAPMSynOnPremiseVantagePointResults.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, GetAPMSynOnPremiseVantagePointResults.commandName, apmDomainId));
                return runWithStatusBarMessage(
                    getOnPremiseVantagePointResults(node.getResourceId(), apmDomainId, node.getOutputChannel()),
                    localize('getOnPremiseVantagePointResultsMessage', 'Getting OPVP results in output tab...'),
                    () => refreshNode(node)
                );
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            DeleteOCIAPMSynOnPremiseVantagePoint.commandName,
            async (node: OCIApmOpvpNode) => {
                _appendCommandInfo(DeleteOCIAPMSynOnPremiseVantagePoint.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, DeleteOCIAPMSynOnPremiseVantagePoint.commandName, apmDomainId));

                const profile = ext.api.getCurrentProfile().getProfileName();
                const prompt = localize('deleteAPMSynOpvpConfirmation', 'Your action will delete all workers and the standalone monitors if they are running on only this on-premise vantage point. Are you sure you want to permanently delete the on-premise vantage point?');
                const yes = localize('yes', 'Yes');
                const no = localize('no', 'No');
                const answer = await vscode.window.showInformationMessage(prompt, yes, no);
                if (answer === yes) {
                    await deleteOnPremiseVantagePoint(profile, node.getApmDomainId(), node.getResourceId());
                    ext.treeDataProvider.refresh(undefined);
                }
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CreateOCIAPMSynWorker.commandName,
            async (node: WorkersNode) => {
                _appendCommandInfo(CreateOCIAPMSynWorker.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, CreateOCIAPMSynWorker.commandName, apmDomainId));
                return runWithStatusBarMessage(
                    createNewWorker(apmDomainId!, node.getOnPremiseVantagePoint(), node.getOutputChannel()),
                    localize('createWorkerMessage', 'Generating worker usage instruction...'),
                    () => refreshNode(node)
                );
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            GetAPMSynWorkerResults.commandName,
            async (node: OCIApmSynWorkerSummaryNode) => {
                _appendCommandInfo(GetAPMSynWorkerResults.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, GetAPMSynWorkerResults.commandName, apmDomainId));
                return runWithStatusBarMessage(
                    getWorkerResults(node.getApmDomainId(), node.getOpvpId(), node.getWorkerId(), node.getOutputChannel()),
                    localize('getWorkerResultsMessage', 'Getting worker results in output tab...'),
                    () => refreshNode(node)
                );
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            UpdatePriorityOCIAPMSynWorker.commandName,
            async (node: OCIApmSynWorkerSummaryNode) => {
                _appendCommandInfo(UpdatePriorityOCIAPMSynWorker.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, UpdatePriorityOCIAPMSynWorker.commandName, apmDomainId));
                return runWithStatusBarMessage(
                    updatePriority(apmDomainId!, node.getOpvpId(), node.getWorkerId(), node.getOutputChannel()),
                    localize('updatePriorityMessage', 'Updating worker priority...'),
                    () => refreshNode(undefined)
                );
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            DisableOCIAPMSynWorker.commandName,
            async (node: OCIApmSynWorkerSummaryNode) => {
                _appendCommandInfo(DisableOCIAPMSynWorker.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, DisableOCIAPMSynWorker.commandName, apmDomainId));

                const profile = ext.api.getCurrentProfile().getProfileName();
                const prompt = localize('disableAPMSynWorkerConfirmation', 'Confirm to disable worker?');
                const yes = localize('yes', 'Yes');
                const no = localize('no', 'No');
                const answer = await vscode.window.showInformationMessage(prompt, yes, no);
                if (answer === yes) {
                    await disableWorker(node.getApmDomainId(), node.getOpvpId(), node.getWorkerId(), profile, node.getOutputChannel());
                    ext.treeDataProvider.refresh(undefined);
                }
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            DeleteOCIAPMSynWorker.commandName,
            async (node: OCIApmSynWorkerSummaryNode) => {
                _appendCommandInfo(DeleteOCIAPMSynWorker.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, DeleteOCIAPMSynWorker.commandName, apmDomainId));

                const profile = ext.api.getCurrentProfile().getProfileName();
                const prompt = localize('deleteAPMSynWorkerConfirmation', 'Your action will delete the worker if it is running on only this on-premise vantage point. Note: Worker instance has to be manually stopped else it may reconnect. Are you sure you want to permanently delete worker?');
                const yes = localize('yes', 'Yes');
                const no = localize('no', 'No');
                const answer = await vscode.window.showInformationMessage(prompt, yes, no);
                if (answer === yes) {
                    await deleteWorker(node.getApmDomainId(), node.getOpvpId(), node.getWorkerId(), profile);
                    ext.treeDataProvider.refresh(undefined);
                }
            }
        ));

}

export async function registerItemContextCommands(context: vscode.ExtensionContext, dataProvider: IOCIProfileTreeDataProvider,) {
    // context.subscriptions.push(
    //     vscode.commands.registerCommand(OpenIssueInGithub.commandName, () => {
    //         _appendCommandInfo(OpenIssueInGithub.commandName, undefined);
    //         MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, OpenIssueInGithub.commandName, undefined));
    //         vscode.env.openExternal(vscode.Uri.parse("https://github.com/oracle-samples/oci-vscode-toolkit/issues"));
    //     }),
    // );
    vscode.commands.executeCommand('setContext', 'enableApmSyntheticsViewTitleMenus', true);
}

export async function registerGenericCommands(context: vscode.ExtensionContext, outputChannel: vscode.OutputChannel) {
    context.subscriptions.push(
        vscode.commands.registerCommand(ExpandCompartment.commandName,
            async function (compartmentId: string) {
                _appendCommandInfo(ExpandCompartment.commandName, compartmentId);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ExpandCompartment.commandName, compartmentId));
                await expandCompartment(compartmentId, outputChannel);
            })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('oci-core.listRecentActions', async (node: any) => {
            const selectedCommand = await listRecentCommands(node);
            executeUserCommand(selectedCommand);
        }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(Launch.commandName, async function (payload: any) {
            _appendCommandInfo(createFullCommandName(Launch.commandName), payload);
            _appendCommandInfo(FocusApmSyntheticPlugin.commandName, undefined);
            await vscode.commands.executeCommand(FocusApmSyntheticPlugin.commandName);
            if (isPayloadValid(payload)) {
                await vscode.commands.executeCommand(FocusApmSyntheticPlugin.commandName); // short term solution for bug fix in theia 1.38
                await vscode.commands.executeCommand(SwitchRegion.commandName, 'us-phoenix-1');
                await launchWorkFlow(payload, outputChannel);
            }
            else {
                const msg = `${localize("payloadNotValidErrorMessage", "Payload is not valid. Please check payload")} ${payload}.`;
                vscode.window.showErrorMessage(msg, { modal: true });
            }
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand(ShowDocumentation.commandName,
            async (item: vscode.TreeItem) => {
                _appendCommandInfo(ShowDocumentation.commandName, undefined);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ShowDocumentation.commandName, undefined));
                await vscode.env.openExternal(
                    vscode.Uri.parse(
                        'https://docs.oracle.com/en-us/iaas/application-performance-monitoring/home.htm',
                    ),
                );
            })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(ListResource.commandName, async () => {
            _appendCommandInfo(ListResource.commandName, undefined);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ListResource.commandName, undefined));
            let options: vscode.InputBoxOptions = {
                prompt: localize("enterCompartmentPickerMessage", "Enter compartment id to list the resources of: "),
                placeHolder: "(placeholder)"
            };
            let compartmentId: string | undefined = await vscode.window.showInputBox(options);
            await expandCompartment(compartmentId, outputChannel);
        }),
    );
}


export async function expandCompartment(compartmentId: string | undefined, outputChannel: vscode.OutputChannel) {
    if (compartmentId) {
        const compartment = await ext.api.getCompartmentById(compartmentId);
        let profileNode: IRootNode = await ext.treeDataProvider.findTreeItem(ext.api.getCurrentProfile().getProfileName()).then(function (data) { return data!; });
        await revealTreeNode(profileNode);

        const compartmentNode = new OCICompartmentNode(compartment?.compartment, ext.api.getCurrentProfile().getProfileName(), undefined, [], outputChannel);
        await revealTreeNode(compartmentNode);
    }
    else {
        const msg = `${localize("notValidCompartmentMessage", "CompartmentId {0} is not valid. Please check the CompartmentId and try again"), compartmentId}`;
        vscode.window.showErrorMessage(msg, { modal: true });
    }
}

