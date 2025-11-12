/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import {
    CreateOCIAPMSynMonitor, ExpandCompartment, ListResource, ShowDocumentation, SignInItem,
    DeleteOCIAPMSynMonitor, FocusApmSyntheticPlugin, SwitchRegion, OpenIssueInGithub,
    createFullCommandName, CreateOCIAPMSynScript, RunNowOCIAPMSynMonitor, GetAPMSynMonitorResults,
    CreateOCIAPMSynOnPremiseVantagePoint, CreateWorkerOCIAPMSynOnPremiseVantagePoint,
    GetAPMSynOnPremiseVantagePointResults, DeleteOCIAPMSynOnPremiseVantagePoint,
    DeleteOCIAPMSynScript,
    EditOCIAPMSynScript,
    CreateOCIAPMSynWorker, DownloadRestWorkerOCIAPMSynOPVP, DownloadSideWorkerOCIAPMSynOPVP,
    EditOCIAPMSynMonitor,
    GetAPMSynWorkerResults, DeleteOCIAPMSynWorker, DisableOCIAPMSynWorker, UpdatePriorityOCIAPMSynWorker,
    Launch,
    DownloadOCIAPMSynScript,
    GetOCIAPMSynMonitorDetails,
    GetOCIAPMSynScriptDetails,
    ViewMonitorInBrowser,
    ViewScriptInBrowser,
    CopyScriptOCID,
    ListVantagePoints,
    CopyMonitorOCID,
    ViewErrorMessage,
    ViewScreenshots,
    GetLogs,
    ViewHar,
    CreateOCIAPMSynScriptFromFile,
    OCIAPMDomainNodeItem,
    CreateOCIAPMSynScriptFromEditor
} from './resources';
import { ExecutionResults } from '../../ui-helpers/ui-helpers';
import { ext } from '../../extensionVars';
import { IOCIProfileTreeDataProvider, IRootNode } from '../../oci-api';
import { IActionResult, isCanceled, hasFailed, newCancellation } from '../../utils/actionResult';
import { OCICompartmentNode } from "../tree/nodes/oci-compartment-node";
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
    webviewEditMonitor,
    runNow, webviewCreateNewMonitor,
    getMonitorDetails, getMonitorExecutionResultMetrics,
    viewHarWebview,
    viewScreenshotWebview,
    viewErrorMessageWebview
} from "./monitorOperations/monitor-operations";
import {
    deleteMonitor, deleteOnPremiseVantagePoint, deleteScript, deleteWorker,
    disableWorker, getScript, listScripts, updateWorkerPriority
} from '../../api/apmsynthetics';
import { MonitorsNode } from '../tree/nodes/monitors-node';
import { OCIApmSynMonitorSummaryNode } from '../tree/nodes/oci-apm-syn-monitor-summary-node';
import { getMonitor, getMonitorResult } from '../../api/apmsynthetics';
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
import { GetResultsWebView } from '../../webViews/ExecutionResults';
import { CreateScriptGetWebview } from '../../webViews/CreateScript';
import { EditScriptGetWebview } from '../../webViews/EditScript';
import { DownloadScript } from '../../webViews/DownloadScript';
import { ViewResultsMonitorWebView } from '../../webViews/ViewResultsMonitorWebView';
import { GetLogsWebView } from '../../webViews/GetLogs';
import { getVPList, VantagePointItem } from './ui/get-monitor-info';
import { getScriptsList } from './ui/get-script-info';
import { Monitor, MonitorScriptParameterInfo, MonitorScriptParameter, ContentTypes } from 'oci-apmsynthetics/lib/model';
import { ViewOutput } from '../../webViews/ViewOutput';
import { TreeView } from 'vscode';
import path = require('path');

const localize: nls.LocalizeFunc = nls.loadMessageBundle();
let currentTreeSelection: IRootNode | undefined;
let fileExplorerScriptPanel: vscode.WebviewPanel | undefined = undefined;
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
    treeView: TreeView<IRootNode>
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
                panel.webview.html = ViewOutput(panel.webview, context.extensionUri, "", outputText);

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

                let panel = vscode.window.createWebviewPanel("createMonitor", "Create Monitor", vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                currentPanel = panel;
                panel.webview.html = CreateMonitorGetWebview(panel.webview, context.extensionUri,
                    stringifiedVpList, stringifiedScriptsList, apmDomainId!);
                panel.webview.onDidReceiveMessage(async (message: {
                    command: any; vantagePoint: any; monitorName: any;
                    target: any; scriptId: any; monitorJson: any, status: boolean
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
                            responsePanel.webview.html = ViewOutput(responsePanel.webview, context.extensionUri, "", outputText);
                            responsePanel.onDidDispose(() => {
                                currentPanel = undefined;
                            });
                            break;
                        case 'save_as_json':
                            if (message.status) {
                                vscode.window.showInformationMessage(localize('fileDownloadSuccess', 'File download is starting...'));
                            } else {
                                vscode.window.showErrorMessage(localize('fileDownloadFailure', 'Error: Unable to download file.'));
                            }
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
                let panel = vscode.window.createWebviewPanel("getExecutionResults", 'Get Execution Results : ' + node.getMonitorName(), vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                panel.webview.html = GetResultsWebView(panel.webview, context.extensionUri, 'Get Execution Results : ' + node.getMonitorName());
                //currentPanel = panel;
                panel.webview.onDidReceiveMessage(async (message: {
                    command: any; selectedTime: string, startDate: any; endDate: any
                }) => {
                    switch (message.command) {
                        case 'get_results':
                            panel.dispose();
                            let responsePanel = vscode.window.createWebviewPanel("viewOutput", "Execution Results : " + node.getMonitorName(), vscode.ViewColumn.One, {
                                enableScripts: true,
                                retainContextWhenHidden: true
                            });
                            currentPanel = responsePanel;
                            try {
                                let r = await getMonitorExecutionResultMetrics(apmDomainId, node.getMonitorId(), node.getMonitorType(), node.getMonitorName(), node.getCompartmentId(),
                                    message.selectedTime, message.startDate, message.endDate, currentPanel, context);
                                if (r.canceled) {
                                    responsePanel.dispose();
                                }
                            } catch (e) {
                                if (typeof e === "string") {
                                    vscode.window.showErrorMessage(e.toUpperCase());
                                } else if (e instanceof Error) {
                                    vscode.window.showErrorMessage(e.message);
                                }
                            }
                            responsePanel.onDidDispose(() => {
                                currentPanel = undefined;
                            });
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
                // panel.onDidDispose(() => {
                //     currentPanel = undefined;
                // });
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
                let panelTitle = "Edit Monitor: " + node.getMonitorName();
                let panel = vscode.window.createWebviewPanel("editMonitor", panelTitle, vscode.ViewColumn.One, {
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
                // unset fields that are received from GET monitor response obj but are not used in edit monitor call
                updatedMonitor["vantagePoints"] = monitor.vantagePoints.map(vp => vp.name);
                updatedMonitor["id"] = undefined;
                updatedMonitor["vantagePointCount"] = undefined;
                updatedMonitor["monitorType"] = undefined;
                updatedMonitor["contentType"] = undefined;
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
                    command: any; apmDomainId: any; monitorId: any; monitorName: any, monitorJson: any, status: boolean
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
                            responsePanel.webview.html = ViewOutput(responsePanel.webview, context.extensionUri, "", outputText);
                            responsePanel.onDidDispose(() => {
                                currentPanel = undefined;
                            });
                            break;
                        case 'save_as_json':
                            if (message.status) {
                                vscode.window.showInformationMessage(localize('fileDownloadSuccess', 'File download is starting...'));
                            } else {
                                vscode.window.showErrorMessage(localize('fileDownloadFailure', 'Error: Unable to download file.'));
                            }
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

                let panel2 = vscode.window.createWebviewPanel("viewOutput", 'View Error : ' + node.getMonitorName(), vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                var vpList = JSON.stringify(await getVPList(apmDomainId));
                panel2.webview.html = ViewResultsMonitorWebView(panel2.webview, context.extensionUri, 'View Error',
                    vpList, node.getMonitorName(), ExecutionResults.ERROR);
                panel2.webview.onDidReceiveMessage(async (message: {
                    command: any; timestamp: string, vp: any, status: boolean
                }) => {
                    switch (message.command) {
                        case 'view_errors':
                            panel2.dispose();
                            viewErrorMessageWebview(currentPanel, apmDomainId, node.getMonitorId(), node.getMonitorType(), node.getMonitorName(),
                                message.vp, message.timestamp, context);
                            break;
                        case 'cancel':
                            const operationCancelledMessage = localize("viewErrorCancelMessage", 'View error message operation was cancelled.');
                            vscode.window.showWarningMessage(
                                operationCancelledMessage, { modal: false }
                            );
                            panel2.dispose();
                            break;
                    }
                },
                    undefined,
                    context.subscriptions
                );
                panel2.onDidDispose(() => {
                    currentPanel = undefined;
                });
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            ViewHar.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(ViewHar.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ViewHar.commandName, apmDomainId));

                if (currentPanel !== undefined && currentPanel.viewType !== "viewOutput") {
                    currentPanel.dispose();
                }
                let panel2 = vscode.window.createWebviewPanel("viewOutput", 'View HAR : ' + node.getMonitorName(), vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                var vpList = JSON.stringify(await getVPList(apmDomainId));
                panel2.webview.html = ViewResultsMonitorWebView(panel2.webview, context.extensionUri, 'View HAR',
                    vpList, node.getMonitorName(), ExecutionResults.HARS);
                panel2.webview.onDidReceiveMessage(async (message: {
                    command: any; timestamp: string, vp: any, status: boolean
                }) => {
                    switch (message.command) {
                        case 'get_hars':
                            panel2.dispose();
                            viewHarWebview(currentPanel, apmDomainId, node.getMonitorId(), node.getMonitorType(), node.getMonitorName(),
                                message.vp, message.timestamp, context);
                            break;
                        case 'cancel':
                            const operationCancelledMessage = localize("getHarCancelMessage", 'View HAR operation was cancelled.');
                            vscode.window.showWarningMessage(
                                operationCancelledMessage, { modal: false }
                            );
                            panel2.dispose();
                            break;
                    }
                },
                    undefined,
                    context.subscriptions
                );
                panel2.onDidDispose(() => {
                    currentPanel = undefined;
                });
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            ViewScreenshots.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(ViewScreenshots.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ViewScreenshots.commandName, apmDomainId));

                if (currentPanel !== undefined && currentPanel.viewType !== "viewOutput") {
                    currentPanel.dispose();
                }

                let panel2 = vscode.window.createWebviewPanel("viewOutput", 'View Screenshots : ' + node.getMonitorName(), vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                var vpList = JSON.stringify(await getVPList(apmDomainId));
                panel2.webview.html = ViewResultsMonitorWebView(panel2.webview, context.extensionUri, 'View Screenshots',
                    vpList, node.getMonitorName(), ExecutionResults.SCREENSHOTS);
                panel2.webview.onDidReceiveMessage(async (message: {
                    command: any; timestamp: string, vp: any, status: boolean
                }) => {
                    switch (message.command) {
                        case 'get_screenshots':
                            panel2.dispose();
                            viewScreenshotWebview(currentPanel, apmDomainId, node.getMonitorId(), node.getMonitorType(), node.getMonitorName(),
                                message.vp, message.timestamp, context);
                            break;
                        case 'cancel':
                            const operationCancelledMessage = localize("getScreenshotCancelMessage", 'View Screenshot operation was cancelled.');
                            vscode.window.showWarningMessage(
                                operationCancelledMessage, { modal: false }
                            );
                            panel2.dispose();
                            break;
                    }
                },
                    undefined,
                    context.subscriptions
                );
                panel2.onDidDispose(() => {
                    currentPanel = undefined;
                });
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            GetLogs.commandName,
            async (node: OCIApmSynMonitorSummaryNode) => {
                _appendCommandInfo(GetLogs.commandName, node);
                const apmDomainId = node.getApmDomainId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, GetLogs.commandName, apmDomainId));
                let panel = vscode.window.createWebviewPanel("viewOutput", 'Download Logs : ' + node.getMonitorName(), vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                var vpList = JSON.stringify(await getVPList(apmDomainId));
                panel.webview.html = GetLogsWebView(panel.webview, context.extensionUri, 'Download Logs', vpList,
                    node.getMonitorName(), ExecutionResults.LOGS);
                panel.webview.onDidReceiveMessage(async (message: {
                    command: any; timestamp: string, vp: any, status: boolean
                }) => {
                    switch (message.command) {
                        case 'get_logs':
                            const result = await getMonitorResult(ext.api.getCurrentProfile().getProfileName(),
                                apmDomainId, node.getMonitorId(), message.vp, "log", "zip", message.timestamp);
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
                            currentPanel.webview.postMessage({ command: 'download_logs', content: content, fileName: fileName });
                            break;
                        case 'download_complete':
                            if (message.status) {
                                vscode.window.showInformationMessage(localize('fileDownloadSuccess', 'File download is starting...'));
                            } else {
                                vscode.window.showErrorMessage(localize('fileDownloadFailure', 'Error: Unable to download logs file.'));
                            }
                            break;
                        case 'cancel':
                            const operationCancelledMessage = localize("getLogsCancelMessage", 'Download execution logs operation was cancelled.');
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
        )
    );

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
                panel.webview.html = CreateScriptGetWebview(panel.webview, context.extensionUri, undefined, "", undefined, "");
                panel.webview.onDidReceiveMessage(async (message: { command: any; scriptName: any; scriptContent: any; scriptFileName: any, scriptContentType: any }) => {
                    switch (message.command) {
                        case 'create_script':
                            let contentType: ContentTypes;
                            switch (message.scriptContentType) {
                                case ContentTypes.PlaywrightTs.toString():
                                    contentType = ContentTypes.PlaywrightTs;
                                    break;
                                case ContentTypes.Side.toString():
                                    contentType = ContentTypes.Side;
                                    break;
                                case ContentTypes.Js.toString():
                                    contentType = ContentTypes.Js;
                                    break;
                            }

                            let r = await runWithStatusBarMessage(
                                webviewCreateNewScript(apmDomainId!, message.scriptName, message.scriptContent, message.scriptFileName, contentType!, panel),
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
                            responsePanel.webview.html = ViewOutput(responsePanel.webview, context.extensionUri, "", outputText);
                            responsePanel.onDidDispose(() => {
                                currentPanel = undefined;
                            });
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

    treeView.onDidChangeSelection(e => {
        if (e.selection[0].commandName === OCIAPMDomainNodeItem.commandName) {
            currentTreeSelection = e.selection[0]; // store latest selected node
            if (fileExplorerScriptPanel && fileExplorerScriptPanel.visible) {
                fileExplorerScriptPanel.webview.postMessage({
                    type: 'treeSelectionChanged',
                    payload: {
                        currentTreeSelection: currentTreeSelection
                    }
                });
            }
        }
    });

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CreateOCIAPMSynScriptFromFile.commandName,
            async (fileUri: vscode.Uri) => {
                scriptCreationFromContextMenu(fileUri, CreateOCIAPMSynScriptFromFile.commandName);
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CreateOCIAPMSynScriptFromEditor.commandName,
            async (fileUri: vscode.Uri) => {
                scriptCreationFromContextMenu(fileUri, CreateOCIAPMSynScriptFromEditor.commandName);
            }
        ));

    async function scriptCreationFromContextMenu(fileUri: vscode.Uri, commandName: string) {
        if (!fileUri) {
            vscode.window.showErrorMessage(localize("noFileSelectedMsg", 'No file selected!'));
            return newCancellation();
        }
        let fileContent: string;
        let fileExt: string;
        let fileName: string;
        try {
            // Read the file content as Uint8Array
            const fileData = await vscode.workspace.fs.readFile(fileUri);
            // Convert to string (assuming UTF-8 encoding)
            fileContent = Buffer.from(fileData).toString('utf8');
            fileExt = path.extname(fileUri.fsPath);
            fileName = path.basename(fileUri.fsPath, fileExt);
        } catch (error) {
            vscode.window.showErrorMessage(localize("failedToReadFileMsg", "Failed to read file"));
        }

        if (currentPanel && currentPanel.viewType !== "viewOutput") {
            currentPanel.dispose();
        }
        _appendCommandInfo(commandName, fileUri);
        // MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, commandName, apmDomainId));

        fileExplorerScriptPanel = vscode.window.createWebviewPanel("createScript", "Create Script", vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        currentPanel = fileExplorerScriptPanel;
        var scriptContentEncoded: any;
        switch (fileExt!) {
            case '.side':
                scriptContentEncoded = btoa(JSON.stringify(fileContent!));
                break;
            case '.ts':
            case '.js':
                scriptContentEncoded = encodeURIComponent(fileContent!);
                break;
            default:
                vscode.window.showErrorMessage(localize('incorrectScriptContentType', 'Incorrect script content type'));
                return newCancellation();
        }

        let currentTreeSelectionStr = JSON.stringify(currentTreeSelection, getCircularReplacer());
        fileExplorerScriptPanel.webview.html = CreateScriptGetWebview(fileExplorerScriptPanel.webview, context.extensionUri,
            scriptContentEncoded!, fileExt!, currentTreeSelectionStr, fileName!);
        fileExplorerScriptPanel.webview.onDidReceiveMessage(async (message: { command: any; scriptName: any; scriptContent: any; scriptFileName: any, scriptContentType: any, currentTreeSelection: any }) => {
            switch (message.command) {
                case 'create_script':
                    let contentType: ContentTypes;
                    switch (message.scriptContentType) {
                        case ContentTypes.PlaywrightTs.toString():
                            contentType = ContentTypes.PlaywrightTs;
                            break;
                        case ContentTypes.Side.toString():
                            contentType = ContentTypes.Side;
                            break;
                        case ContentTypes.Js.toString():
                            contentType = ContentTypes.Js;
                            break;
                    }
                    if (message.currentTreeSelection === undefined) {
                        vscode.window.showErrorMessage(localize('currentTreeSelectionNotFound', 'APM domain is not selected. You need to select an APM domain from the tree view of APM extension.'));
                        return newCancellation();
                    }
                    let currentTreeSelectionParsed = JSON.parse(message.currentTreeSelection);
                    let apmDomainId = currentTreeSelectionParsed.id;
                    let r = await runWithStatusBarMessage(
                        webviewCreateNewScript(apmDomainId!, message.scriptName, message.scriptContent, message.scriptFileName, contentType!, fileExplorerScriptPanel!),
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
                    responsePanel.webview.html = ViewOutput(responsePanel.webview, context.extensionUri, "", outputText);
                    responsePanel.onDidDispose(() => {
                        currentPanel = undefined;
                    });
                    break;
                case 'cancel':
                    const operationCancelledMessage = localize("scriptCancelledMessage", 'Script create operation was cancelled.');
                    vscode.window.showWarningMessage(
                        operationCancelledMessage, { modal: false }
                    );
                    fileExplorerScriptPanel!.dispose();
                    break;
            }
        },
            undefined,
            context.subscriptions
        );
        fileExplorerScriptPanel.onDidDispose(() => {
            currentPanel = undefined;
            fileExplorerScriptPanel = undefined;
        });
    }

    function getCircularReplacer() {
        const seen = new WeakSet();
        return function (key: any, value: object | null) {
            if (typeof value === "object" && value !== null) {
                if (seen.has(value)) {
                    return undefined; // Skip circular reference
                }
                seen.add(value);
            }
            return value;
        };
    }

    context.subscriptions.push(
        vscode.commands.registerCommand(
            DownloadOCIAPMSynScript.commandName,
            async (node: OCIApmSynScriptSummaryNode) => {
                _appendCommandInfo(DownloadOCIAPMSynScript.commandName, node);
                const apmDomainId = node.getApmDomainId();
                const scriptId = node.getScriptId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, DownloadOCIAPMSynScript.commandName, apmDomainId));
                let panel = vscode.window.createWebviewPanel("downloadScript", "Download Script", vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                currentPanel = panel;
                const profile = ext.api.getCurrentProfile().getProfileName();
                const scriptDetails = await getScript(profile, apmDomainId!, scriptId);
                const scriptContent = scriptDetails.content;
                if (scriptContent === undefined) {
                    vscode.window.showErrorMessage(localize('scriptContentNotFound', 'Script content not found, cancelling operation'));
                    node.getOutputChannel().appendLine(localize('scriptContentNotFound', 'Script content not found, cancelling operation'));
                    return newCancellation();
                }

                const scriptContentType = scriptDetails.contentType;
                var scriptContentEncoded;
                var defaultFileName: string;
                switch (scriptContentType) {
                    case ContentTypes.Side:
                        defaultFileName = 'monitor.side';
                        scriptContentEncoded = btoa(JSON.stringify(scriptContent));
                        break;
                    case ContentTypes.PlaywrightTs:
                        defaultFileName = 'monitor.ts';
                        scriptContentEncoded = encodeURIComponent(scriptContent);
                        break;
                    case ContentTypes.Js:
                        defaultFileName = 'monitor.js';
                        scriptContentEncoded = encodeURIComponent(scriptContent);
                        break;
                    case ContentTypes.UnknownValue:
                        vscode.window.showErrorMessage(localize('incorrectScriptContentType', 'Incorrect script content type'));
                        return newCancellation();
                }
                panel.webview.html = DownloadScript(panel.webview, context.extensionUri, 'Downloading Script: ' + scriptDetails.displayName,
                    scriptContentEncoded, scriptContentType.toString(), scriptDetails.contentFileName ?? defaultFileName!);
                panel.webview.onDidReceiveMessage(async (message: { command: any; status: boolean }) => {
                    switch (message.command) {
                        case 'download_complete':
                            if (message.status) {
                                vscode.window.showInformationMessage(localize('fileDownloadSuccess', 'File download is starting...'));
                            } else {
                                vscode.window.showErrorMessage(localize('fileDownloadFailure', 'Error: Unable to download file.'));
                            }
                            break;
                        case 'cancel':
                            const operationCancelledMessage = localize("scriptCancelledMessage", 'Script download operation was cancelled.');
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

                const scriptContentType = scriptDetails.contentType;
                var scriptContentEncoded: any;
                switch (scriptContentType) {
                    case ContentTypes.Side:
                        scriptContentEncoded = btoa(JSON.stringify(scriptContent));
                        break;
                    case ContentTypes.Js:
                    case ContentTypes.PlaywrightTs:
                        scriptContentEncoded = encodeURIComponent(scriptContent);
                        break;
                    case ContentTypes.UnknownValue:
                        vscode.window.showErrorMessage(localize('incorrectScriptContentType', 'Incorrect script content type'));
                        return newCancellation();
                }

                let panelTitle = "Edit Script: " + node.getScriptName();
                let panel = vscode.window.createWebviewPanel("editScript", panelTitle, vscode.ViewColumn.One, {
                    enableScripts: true,
                    retainContextWhenHidden: true
                });
                currentPanel = panel;

                panel.webview.html = EditScriptGetWebview(panel.webview, context.extensionUri,
                    node.synScriptSummary.displayName, node.synScriptSummary.id, scriptContentType.toString(), scriptContentEncoded!);
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
                            responsePanel.webview.html = ViewOutput(responsePanel.webview, context.extensionUri, "", outputText);
                            responsePanel.onDidDispose(() => {
                                currentPanel = undefined;
                            });
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
    context.subscriptions.push(
        vscode.commands.registerCommand(OpenIssueInGithub.commandName, () => {
            _appendCommandInfo(OpenIssueInGithub.commandName, undefined);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, OpenIssueInGithub.commandName, undefined));
            vscode.env.openExternal(vscode.Uri.parse("https://github.com/oracle-samples/oci-vscode-toolkit/issues"));
        }),
    );
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
        vscode.commands.registerCommand('apm.listRecentActions', async (node: any) => {
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

