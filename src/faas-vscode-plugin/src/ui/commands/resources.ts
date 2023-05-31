/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as nls from 'vscode-nls';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

const commandPrefix = 'faas';
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

export const CreateOCIFunction = {
    commandName: `${commandPrefix}.createOCIFunction`,
};

export const EditOCIFunction = {
    commandName: `${commandPrefix}.editOCIFunction`,
};

export const DeployOCIFunction = {
    commandName: `${commandPrefix}.deployOCIFunction`,
};

export const InvokeOCIFunction = {
    commandName: `${commandPrefix}.invokeOCIFunction`,
};

export const DeleteOCIFunction = {
    commandName: `${commandPrefix}.deleteOCIFunction`,
};

export const DeleteOCIApplication = {
    commandName: `${commandPrefix}.deleteOCIApplication`,
};

export const EditConfiguration = {
    commandName: `${commandPrefix}.editConfiguration`,
};

export const EditFunctionSettings = {
    commandName: `${commandPrefix}.editFunctionSettings`,
};

export const CreateNewOCIApplication = {
    commandName: `${commandPrefix}.createNewOCIApplication`,
};

export const EditOCIApplication = {
    commandName: `${commandPrefix}.editOCIApplication`,
};

export const ShowDocumentation = {
    commandName: `${commandPrefix}.ShowDocumentation`,
    label: `${localize('docNodeLabel', "About OCI Functions")}`,
    context: 'DocumentationNode'
};

export const CompartmentsItem = {
    commandName: `${commandPrefix}.compartmentsNode`,
    label: `${localize('staticCompartmentsNodeLabel', 'Compartments')}`,
    context: 'CompartmentsTree',
};

export const OCIApplicationNodeItem = {
    commandName: `${commandPrefix}.ociApplicationsNode`,
    context: 'OCIApplicationNode'
};

export const OCIFunctionNodeItem = {
    commandName: `${commandPrefix}.ociFunctionNode`,
    context: 'OCIFunctionNode'
};

export const OCIConfigurationNodeItem = {
    commandName: `${commandPrefix}.ociConfigurationNode`,
    lightIcon: '',
    darkIcon: '',
    context: 'OCIConfigurationNode',
};

export const OCIConfigurationFunctionRootNodeItem = {
    commandName: `${commandPrefix}.ociConfigurationFunctionRootNode`,
    context: 'OCIConfigurationFunctionRootNode',
};

export const OCIConfigurationApplicationRootNodeItem = {
    commandName: `${commandPrefix}.ociConfigurationApplicationRootNode`,
    context: 'OCIConfigurationApplicationRootNode',
};

export const ApplicationsItem = {
    commandName: `${commandPrefix}.staticApplicationNode`,
    label: `${localize('staticApplicationsNodeLabel', 'Applications')}`,
    context: 'ApplicationsNode',
};

export const launchWorkFlowCommand = {
    commandName: `${commandPrefix}.launch`,
};

export const FocusFunctionsPlugin = {
    commandName: `${commandPrefix}.focus`
};

export const SwitchRegion = {
    commandName: `${commandCorePrefix}.switchRegion`
};

export const treeNodeCommands: string[] = [OCIApplicationNodeItem.commandName, OCIFunctionNodeItem.commandName, ApplicationsItem.commandName, CompartmentsItem.commandName];
