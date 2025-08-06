/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as nls from 'vscode-nls';
import { OCIApmSynScriptSummaryNode } from '../tree/nodes/oci-apm-syn-script-summary-node';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

const commandPrefix = 'apm';
const commandCorePrefix = 'oci-core';

export const createFullCommandName = (cmd: string): string => `${commandPrefix}.${cmd}`;

export const RefreshTree = {
    commandName: `${commandPrefix}.refreshTree`,
};

export const OpenIssueInGithub = {
    commandName: `${commandPrefix}.openIssueInGithub`,
};

export const ExpandCompartment = {
    commandName: `${commandPrefix}.expandCompartment`,
};

export const ListResource = {
    commandName: `${commandPrefix}.filterCompartment`,
};

export const SignInItem = {
    commandName: `${commandPrefix}.signIn`,
};

export const ShowDocumentation = {
    commandName: `${commandPrefix}.ShowDocumentation`,
    label: `${localize('docNodeLabel', "About OCI Application Performance Monitoring")}`,
    context: 'DocumentationNode'
};

export const CompartmentsItem = {
    commandName: `${commandPrefix}.compartmentsNode`,
    label: `${localize('staticCompartmentsNodeLabel', 'Compartments')}`,
    context: 'CompartmentsTree',
};

export const OCIAPMDomainNodeItem = {
    commandName: `${commandPrefix}.ociAPMDomainNode`,
    context: 'OCIAPMDomainNode'
};

export const OCIAPMSynOnPremiseVantagePointNodeItem = {
    commandName: `${commandPrefix}.ociAPMSynOnPremiseVantagePointNode`,
    context: 'OCIAPMSynOnPremiseVantagePointNode'
};

export const OCIApmOpvpNodeItem = {
    commandName: `${commandPrefix}.ociApmOpvpNode`,
    context: 'OCIApmOpvpNode'
};

export const OCIAPMSynWorkerNodeItem = {
    commandName: `${commandPrefix}.ociAPMSynWorkerNode`,
    context: 'OCIAPMSynWorkerNode'
};

export const OCIApmSynWorkerSummaryNodeItem = {
    commandName: `${commandPrefix}.ociApmSynWorkerSummaryNode`,
    context: 'OCIApmSynWorkerSummaryNode'
};

export const OCIAPMSynMonitorNodeItem = {
    commandName: `${commandPrefix}.ociAPMSynMonitorNode`,
    context: 'OCIAPMSynMonitorNode'
};

export const OCIApmSynMonitorSummaryNodeItem = {
    commandName: `${commandPrefix}.ociApmSynMonitorSummaryNode`,
    context: 'OCIApmSynMonitorSummaryNode'
};

export const OCIApmSynScriptSummaryNodeItem = {
    commandName: `${commandPrefix}.ociApmSynScriptSummaryNode`,
    context: 'OCIApmSynScriptSummaryNode'
};

export const CreateOCIAPMSynMonitor = {
    commandName: `${commandPrefix}.createOCIAPMSynMonitor`,
};

export const ListVantagePoints = {
    commandName: `${commandPrefix}.listVantagePoints`,
};

export const RunNowOCIAPMSynMonitor = {
    commandName: `${commandPrefix}.runNowOCIAPMSynMonitor`,
};

export const GetAPMSynMonitorResults = {
    commandName: `${commandPrefix}.getAPMSynMonitorResults`,
};

export const EditOCIAPMSynMonitor = {
    commandName: `${commandPrefix}.editOCIAPMSynMonitor`,
};

export const GetOCIAPMSynMonitorDetails = {
    commandName: `${commandPrefix}.getOCIAPMSynMonitorDetails`,
};

export const ViewErrorMessage = {
    commandName: `${commandPrefix}.viewErrorMessage`,
};

export const ViewHar = {
    commandName: `${commandPrefix}.viewHar`,
};

export const ViewScreenshots = {
    commandName: `${commandPrefix}.viewScreenshots`,
};

export const GetLogs = {
    commandName: `${commandPrefix}.getLogs`,
};

export const ViewMonitorInBrowser = {
    commandName: `${commandPrefix}.viewMonitorInBrowser`,
};

export const DeleteOCIAPMSynMonitor = {
    commandName: `${commandPrefix}.deleteOCIAPMSynMonitor`,
};

export const CopyMonitorOCID = {
    commandName: `${commandPrefix}.copyMonitorOCID`,
};

export const CreateOCIAPMSynScript = {
    commandName: `${commandPrefix}.createOCIAPMSynScript`,
};

export const CreateOCIAPMSynScriptFromFile = {
    commandName: `${commandPrefix}.createOCIAPMSynScriptFromFile`,
};

export const CreateOCIAPMSynScriptFromEditor = {
    commandName: `${commandPrefix}.createOCIAPMSynScriptFromEditor`,
};

export const EditOCIAPMSynScript = {
    commandName: `${commandPrefix}.editOCIAPMSynScript`,
};

export const DeleteOCIAPMSynScript = {
    commandName: `${commandPrefix}.deleteOCIAPMSynScript`,
};

export const GetOCIAPMSynScriptDetails = {
    commandName: `${commandPrefix}.getOCIAPMSynScriptDetails`,
};

export const DownloadOCIAPMSynScript = {
    commandName: `${commandPrefix}.downloadOCIAPMSynScript`,
};

export const ViewScriptInBrowser = {
    commandName: `${commandPrefix}.viewScriptInBrowser`,
};

export const CopyScriptOCID = {
    commandName: `${commandPrefix}.copyScriptOCID`,
};

// opvp command

export const CreateOCIAPMSynOnPremiseVantagePoint = {
    commandName: `${commandPrefix}.createOCIAPMSynOnPremiseVantagePoint`,
};

export const DownloadRestWorkerOCIAPMSynOPVP = {
    commandName: `${commandPrefix}.downloadRestWorkerOCIAPMSynOPVP`,
};

export const DownloadSideWorkerOCIAPMSynOPVP = {
    commandName: `${commandPrefix}.downloadSideWorkerOCIAPMSynOPVP`,
};

export const CreateWorkerOCIAPMSynOnPremiseVantagePoint = {
    commandName: `${commandPrefix}.createWorkerOCIAPMSynOnPremiseVantagePoint`,
};

export const GetAPMSynOnPremiseVantagePointResults = {
    commandName: `${commandPrefix}.getAPMSynOnPremiseVantagePointResults`,
};

export const DeleteOCIAPMSynOnPremiseVantagePoint = {
    commandName: `${commandPrefix}.deleteOCIAPMSynOnPremiseVantagePoint`,
};

// worker command

export const CreateOCIAPMSynWorker = {
    commandName: `${commandPrefix}.createOCIAPMSynWorker`,
};

export const GetAPMSynWorkerResults = {
    commandName: `${commandPrefix}.getAPMSynWorkerResults`,
};

export const UpdatePriorityOCIAPMSynWorker = {
    commandName: `${commandPrefix}.updatePriorityOCIAPMSynWorker`,
};

export const DisableOCIAPMSynWorker = {
    commandName: `${commandPrefix}.disableOCIAPMSynWorker`,
};

export const DeleteOCIAPMSynWorker = {
    commandName: `${commandPrefix}.deleteOCIAPMSynWorker`,
};

export const OCIConfigurationNodeItem = {
    commandName: `${commandPrefix}.ociConfigurationNode`,
    lightIcon: '',
    darkIcon: '',
    context: 'OCIConfigurationNode',
};

export const ApmDomainsItem = {
    commandName: `${commandPrefix}.staticApmDomainNode`,
    label: `${localize('staticApmDomainsNodeLabel', 'APM Domains')}`,
    context: 'ApmDomainsNode',
};

export const OnPremiseVantagePointsItem = {
    commandName: `${commandPrefix}.staticOnPremiseVantagePointNode`,
    label: `${localize('staticOnPremiseVantagePointsNodeLabel', 'On-Premise Vantage Points')}`,
    context: 'OnPremiseVantagePointsNode',
};

export const WorkersItem = {
    commandName: `${commandPrefix}.staticWorkerNode`,
    label: `${localize('staticWorkersNodeLabel', 'Workers')}`,
    context: 'WorkersNode',
};

export const MonitorsItem = {
    commandName: `${commandPrefix}.staticMonitorNode`,
    label: `${localize('staticMonitorsNodeLabel', 'Monitors')}`,
    context: 'MonitorsNode',
};

export const ScriptsItem = {
    commandName: `${commandPrefix}.staticScriptNode`,
    label: `${localize('staticScriptsNodeLabel', 'Scripts')}`,
    context: 'ScriptsNode',
};

export const Launch = {
    commandName: `${commandPrefix}.launch`,
};

export const FocusApmSyntheticPlugin = {
    commandName: `${commandPrefix}.focus`
};

export const SwitchRegion = {
    commandName: `${commandCorePrefix}.switchRegion`
};

export const treeNodeCommands: string[] = [OCIAPMDomainNodeItem.commandName, OCIAPMSynOnPremiseVantagePointNodeItem.commandName,
OCIApmOpvpNodeItem.commandName, OCIAPMSynWorkerNodeItem.commandName,
OCIApmSynWorkerSummaryNodeItem.commandName, OCIAPMSynMonitorNodeItem.commandName,
OCIApmSynMonitorSummaryNodeItem.commandName, OCIApmSynScriptSummaryNodeItem.commandName,
CompartmentsItem.commandName, ApmDomainsItem.commandName,
OnPremiseVantagePointsItem.commandName, WorkersItem.commandName, MonitorsItem.commandName,
ScriptsItem.commandName];
