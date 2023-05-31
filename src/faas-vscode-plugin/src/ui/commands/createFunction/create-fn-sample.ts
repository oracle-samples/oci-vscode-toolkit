/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import { ext } from '../../../extensionVars';
import { IOCIProfileTreeDataProvider } from '../../../oci-api';
import { OCIApplicationNode } from "../../tree/nodes/oci-application-node";
import { OCINewFunctionNode, OCINewFunctionType } from '../../tree/nodes/oci-new-function-node';
import { promptForFunctionName, promptForFunctionSample } from '../../../ui-helpers/ui-helpers';
import { IActionResult, newCancellation, newError, newSuccess } from '../../../utils/actionResult';
import { logger } from '../../../utils/get-logger';
import { SampleMappings } from '../../../utils/sampleGithubMappings';
import { getFunctionsFolder } from '../../../common/fileSystem/local-artifact';
import { METRIC_INVOCATION, METRIC_SUCCESS, METRIC_FAILURE } from 'oci-ide-plugin-base/dist/monitoring/monitoring';
import { Service } from 'oci-ide-plugin-base/dist/monitoring/service';
import { MONITOR } from '../../../common/monitor';
export async function createFunctionFromSample(application: OCIApplicationNode, treeDataProvider: IOCIProfileTreeDataProvider): Promise<IActionResult> {

    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'createFunctionFromSample', application.resource.compartmentId!));
    const sampl_mapping_obj = new SampleMappings();
    const sampleSelected = await promptForFunctionSample(
        sampl_mapping_obj.getSampleNames()
    );
    if (sampleSelected === undefined) {
        return newCancellation();
    }

    const functionName = (await promptForFunctionName())?.toLowerCase();
    if (functionName === undefined) {
        return newCancellation();
    }

    const functionFolder = getFunctionsFolder(application.id, functionName);
    try {
        let moveSample = sampl_mapping_obj.getMappingBySampleName(sampleSelected);

        SampleMappings.copySampleToLocal(moveSample.folder, functionFolder);

        //Add new function node
        OCIApplicationNode.newFunctions.push(new OCINewFunctionNode(
            { name: functionName, id: application.id + "_my_application_" + OCIApplicationNode.newFunctionCounter, type: OCINewFunctionType.FromSample.type, displayName: functionName },
            ext.api.getCurrentProfile().getProfileName(),
            undefined,
            application,
            vscode.Uri.file(functionFolder)
        ));
        OCIApplicationNode.newFunctionCounter += 1;
        treeDataProvider.refresh(application);
        await ext.treeView.reveal(application, { focus: true, select: true, expand: 1 });
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'createFunctionFromSample', application.resource.compartmentId!));
    } catch (error: any) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'createFunctionFromSample', application.resource.compartmentId!, undefined, '' + error));
        logger().info(error);
        return newError(error);
    }
    return newSuccess();
}
