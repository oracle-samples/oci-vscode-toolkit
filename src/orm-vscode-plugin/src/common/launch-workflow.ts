/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { getStack } from "../api/orm-client";
import { ext } from "../extensionVars";
import { IRootNode } from "../oci-api";
import { OCICompartmentNode } from "../tree/nodes/oci-compartment-node";
import { CompartmentsNode } from "../tree/nodes/oci-compartments-node";
import { OCIStackNode } from "../tree/nodes/oci-stack-node";
import { StacksNode } from "../tree/nodes/static-stacks-node";
import { logger } from "../utils/get-logger";
import * as nls from "vscode-nls";
import { METRIC_INVOCATION, METRIC_SUCCESS, METRIC_FAILURE } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import { MONITOR } from "./monitor";

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

 export async function launchWorkFlow(payload: any) {
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'launchWorkFlow',payload.compartment_ocid));
        let profileNode : IRootNode = await ext.treeDataProvider.findTreeItem(ext.api.getCurrentProfile().getProfileName()).then(function(data) {return data!;});
        await revealTreeNode(profileNode);
        
        const compartment = await ext.api.getCompartmentById(payload.compartment_ocid!);
        const staticCompartmentsNode = new CompartmentsNode();
        await revealTreeNode(staticCompartmentsNode);

        const compartmentNode = new OCICompartmentNode(compartment?.compartment, ext.api.getCurrentProfile().getProfileName(), undefined, []);
        await revealTreeNode(compartmentNode);

        const stacksNode =  new StacksNode(compartment?.compartment.id);
        await revealTreeNode(stacksNode);

        const stack = await getStack(payload.resource_ocid);
        const stackNode = new OCIStackNode(stack?.stack);
        await revealTreeNode(stackNode, true, true, 3);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'launchWorkFlow',payload.compartment_ocid));
    } catch (error) {
        let errorMsg = localize('launchWorkflowErrorMsg','Error in expanding tree hierarchy for payload: ');
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'launchWorkFlow',payload.compartment_ocid, undefined, JSON.stringify(error)));
        logger().error(errorMsg, payload, error);
        throw error;
    }
}

export async function revealTreeNode(node: IRootNode, shouldFocus: boolean = true, shouldSelect: boolean = true, expandLevel: number = 1) {
    await ext.treeView.reveal(node, { focus: shouldFocus, select: shouldSelect, expand: expandLevel });
}
