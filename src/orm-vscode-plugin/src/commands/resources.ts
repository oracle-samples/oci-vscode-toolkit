/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as nls from 'vscode-nls';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
const commandPrefix = 'rms';
const commandCorePrefix = 'oci-core';

export const createFullCommandName = (cmd: string): string =>
    `rms.${cmd}`;

export const createFullCorePluginCommandName = (cmd: string): string =>
    `oci-core.${cmd}`;

export const RefreshTree = {
    commandName: `${commandPrefix}.refreshTree`,
};

export const SignInItem = {
    commandName: `${commandPrefix}.signIn`,
};

export const OCIStackNodeItem = {
    commandName: `${commandPrefix}.ociStackNode`,
    context: 'OCIStackNode',
};

export const OCIStaticStacksNode = {
    commandName: `${commandPrefix}.ormStaticStacksNode`,
    context: 'OCIStackNode',
};

export const UpdateStack = {
    commandName: `${commandPrefix}.updateStack`,
};

export const UpdatePlanStack = {
    commandName: `${commandPrefix}.updatePlanStack`,
};

export const UpdateApplyStack = {
    commandName: `${commandPrefix}.updateApplyStack`,
};

export const DocumentationItem = {
    commandName: `${commandPrefix}.documentationNode`,
    label: `${localize('docNodeLabel', "About Resource Manager stacks")}`,
    context: 'DocumentationNode'
};

export const CompartmentsItem = {
    commandName: `${commandPrefix}.compartmentsNode`,
    label: `${localize('staticCompartmentsNodeLabel', 'Compartments')}`,
    context: 'OCICompartmentNode',
};

export const TFConfigurationNodeItem = {
    commandName: `${commandPrefix}.editStack`,
    context: 'TFConfigurationNode',
};

export const StacksItem = {
    commandName: `${commandPrefix}.ormStaticStacksNode`,
    label: `${localize('staticStacksNodeLabel', 'Stacks')}`,
    context: 'StacksNode',
};

export const FocusRMSPlugin = {
    commandName: `${commandPrefix}.focus`
};

export const SwitchRegion = {
    commandName: `${commandCorePrefix}.switchRegion`
};

export const treeNodeCommands: string[] = [OCIStackNodeItem.commandName, OCIStaticStacksNode.commandName, CompartmentsItem.commandName];
