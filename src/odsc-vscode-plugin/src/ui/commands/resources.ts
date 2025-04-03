/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as nls from 'vscode-nls';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export const commandPrefix = 'odsc';
export const commandCorePrefix = 'oci-core';

export const createFullCommandName = (cmd: string): string => `${commandPrefix}.${cmd}`;

export const RefreshTree = {
    commandName: `${commandPrefix}.refreshTree`,
};

export const ListRecentActions = {
    commandName: `${commandPrefix}.listRecentActions`,    
};

export const SignInItem = {
    commandName: `${commandPrefix}.signIn`,
};

export const ShowDocumentation = {
    commandName: `${commandPrefix}.showDocumentation`,
    label:`${localize('docNodeLabel','About OCI Data Science')}`,
    context: 'DocumentationNode',
};

export const CompartmentsItem = {
    commandName: `${commandPrefix}.compartmentsNode`,
    label:`${localize('staticCompartmentsNodeLabel','Compartments')}`,
    context: 'CompartmentsTree',
};

export const OpenIssueInGithub = {
    commandName: `${commandPrefix}.openIssueInGithub`,
};

export const ListResource = {
    commandName: `${commandPrefix}.filterCompartment`,
};

export const ProjectsItem = {
    commandName: `${commandPrefix}.staticProjectsNode`,
    label:`${localize('staticProjectsNodeLabel','Projects')}`,
    context: 'ProjectsNode',
};

export const OCIProjectNodeItem = {
    commandName: `${commandPrefix}.ociProjectNode`,
    context: 'OCIProjectNode'
};

export const CreateJob = {
    commandName: `${commandPrefix}.createJob`,
};

export const GetJobArtifact = {
    commandName: `${commandPrefix}.getJobArtifact`,
};

export const RunJob = {
    commandName: `${commandPrefix}.runJob`
};

export const OCIJobNodeItem = {
    commandName: `${commandPrefix}.ociJobNode`,
    context: 'OCIJobNode'
};

export const OCIJobRunNodeItem = {
    commandName: `${commandPrefix}.ociJobRunNode`,
    context: 'OCIJobRunNode'
};

export const FocusDataSciencePlugin = {
    commandName: `${commandPrefix}.focus`
};

export const SwitchRegion = {
    commandName: `${commandCorePrefix}.switchRegion`
};

export const treeNodeCommands: string[] = [ProjectsItem.commandName, OCIProjectNodeItem.commandName, OCIJobNodeItem.commandName, OCIJobRunNodeItem.commandName, CompartmentsItem.commandName];
