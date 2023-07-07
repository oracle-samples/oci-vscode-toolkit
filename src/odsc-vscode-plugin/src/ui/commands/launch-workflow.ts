/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { ext } from "../../extensionVars";
import { logger } from "../vscode_ext";
import { IRootNode } from "../../oci-api";
import { OCICompartmentNode } from "../treeNodes/oci-compartment-node";
import { CompartmentsNode } from "../treeNodes/oci-compartments-node";
import { ProjectsNode } from "../treeNodes/static-projects-node";
import { OCIProjectNode } from "../treeNodes/oci-project-node";
import { OCIJobNode } from "../treeNodes/oci-job-node";
import * as dataScience from "../../api/oci/data-science";
import * as nls from "vscode-nls";
import { MONITOR } from "../../common/monitor";
import { METRIC_FAILURE, METRIC_INVOCATION, METRIC_SUCCESS } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function launchWorkFlow(payload: any) {
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'launchWorkFlow', payload.compartment_ocid!));          
        const profile = ext.api.getCurrentProfile();
        const profileNode : IRootNode = await ext.treeDataProvider.findTreeItem(profile.getProfileName()).then(function(data) {return data!;});
        await revealTreeNode(profileNode);
        
        const compartment = await ext.api.getCompartmentById(payload.compartment_ocid!);
        const staticCompartmentsNode = new CompartmentsNode();
        await revealTreeNode(staticCompartmentsNode);

        const compartmentNode = new OCICompartmentNode(compartment?.compartment, profile.getProfileName(), undefined, []);
        await revealTreeNode(compartmentNode);

        const staticProjectsNode = new ProjectsNode(compartmentNode);
        await revealTreeNode(staticProjectsNode);

        const job = await dataScience.getJob(payload.resource_ocid);
        const project = await dataScience.getProject(job.projectId);
        const projectNode = new OCIProjectNode(project);
        await revealTreeNode(projectNode);

        const jobNode = new OCIJobNode(job);
        await revealTreeNode(jobNode, true, true, 2);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'launchWorkFlow', payload.compartment_ocid!, payload.resource_ocid));          
    } catch (error) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'launchWorkFlow', payload.compartment_ocid!, payload.resource_ocid, JSON.stringify(error)));          
        const errorMsg = localize('launchWorkflowErrorMsg','Error in expanding tree hierarchy for payload: ');
        logger().error(errorMsg, payload, error);
        throw error;
    }
}  

export async function revealTreeNode(node: IRootNode, shouldFocus: boolean = false, shouldSelect: boolean = false, expandLevel: number = 1) {
    await ext.treeView.reveal(node, { focus: shouldFocus, select: shouldSelect, expand: expandLevel });
}
