/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { ext } from "../../../extensionVars";
import { OCIApplicationNode } from "../../tree/nodes/oci-application-node";
import { OCICompartmentNode } from "../../tree/nodes/oci-compartment-node";
import { logger } from "../../../utils/get-logger";
import { ApplicationsNode } from '../../tree/nodes/applications-node';
import { getApplication } from "../../../api/function";
import { CreateOCIFunction } from "../resources";
import * as vscode from 'vscode';
import { IRootNode } from "../../../oci-api";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import { METRIC_FAILURE, METRIC_INVOCATION, METRIC_SUCCESS } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { MONITOR } from "../../../common/monitor";
export async function launchWorkFlow(payload: any) {
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'launchWorkFlow', payload.compartment_ocid!));
        let profileNode: IRootNode = await ext.treeDataProvider.findTreeItem(ext.api.getCurrentProfile().getProfileName()).then(function (data) { return data!; });
        await revealTreeNode(profileNode);

        const compartment = await ext.api.getCompartmentById(payload.compartment_ocid!);

        const compartmentNode = new OCICompartmentNode(compartment?.compartment, ext.api.getCurrentProfile().getProfileName(), undefined, []);
        await revealTreeNode(compartmentNode);

        const appNode = new ApplicationsNode(ext.api.getCurrentProfile(), compartment.compartment.id);
        await revealTreeNode(appNode);

        let app = await getApplication(ext.api.getCurrentProfile().getProfileName(), payload.resource_ocid);
        let ociAppNode: OCIApplicationNode = new OCIApplicationNode(app, ext.api.getCurrentProfile().getProfileName(), appNode);

        await revealTreeNode(ociAppNode);
        await vscode.commands.executeCommand(CreateOCIFunction.commandName, ociAppNode);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'launchWorkFlow', compartmentNode.id, ociAppNode.id));

    } catch (error) {
        logger().error("Error in expanding tree hierarchy for payload: ", payload, error);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'launchWorkFlow', payload.compartment_ocid!, undefined, '' + error));
        throw error;
    }
}

export async function revealTreeNode(node: IRootNode, shouldFocus: boolean = true, shouldSelect: boolean = true, expandLevel: number = 1) {
    await ext.treeView.reveal(node, { focus: shouldFocus, select: shouldSelect, expand: expandLevel });
}
