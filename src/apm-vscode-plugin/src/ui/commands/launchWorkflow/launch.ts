/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { ext } from "../../../extensionVars";
import { OCICompartmentNode } from "../../tree/nodes/oci-compartment-node";
import { logger } from "../../../utils/get-logger";
import * as vscode from 'vscode';
import { IRootNode } from "../../../oci-api";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import { METRIC_FAILURE, METRIC_INVOCATION, METRIC_SUCCESS } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { MONITOR } from "../../../common/monitor";
export async function launchWorkFlow(payload: any, outputChannel: vscode.OutputChannel) {
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'launchWorkFlow', payload.compartment_ocid!));
        let profileNode: IRootNode = await ext.treeDataProvider.findTreeItem(ext.api.getCurrentProfile().getProfileName()).then(function (data) { return data!; });
        await revealTreeNode(profileNode);

        const compartment = await ext.api.getCompartmentById(payload.compartment_ocid!);

        const compartmentNode = new OCICompartmentNode(compartment?.compartment, ext.api.getCurrentProfile().getProfileName(), undefined, [], outputChannel);
        await revealTreeNode(compartmentNode);
    } catch (error) {
        logger().error("Error in expanding tree hierarchy for payload: ", payload, error);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'launchWorkFlow', payload.compartment_ocid!, undefined, '' + error));
        throw error;
    }
}

export async function revealTreeNode(node: IRootNode, shouldFocus: boolean = true, shouldSelect: boolean = true, expandLevel: number = 1) {
    await ext.treeView.reveal(node, { focus: shouldFocus, select: shouldSelect, expand: expandLevel });
}
