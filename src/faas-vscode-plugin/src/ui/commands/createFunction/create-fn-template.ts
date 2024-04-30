/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import { ext } from '../../../extensionVars';
import { IOCIProfileTreeDataProvider } from '../../../oci-api';
import { OCIApplicationNode } from "../../tree/nodes/oci-application-node";
import { OCINewFunctionNode, OCINewFunctionType } from '../../tree/nodes/oci-new-function-node';
import { promptForFunctionLanguage, promptForFunctionName } from '../../../ui-helpers/ui-helpers';
import { IActionResult, newCancellation, newError, newSuccess } from '../../../utils/actionResult';
import { TemplateMappings } from '../../../utils/templateMappings';
import { FunctionTemplate } from '../../../utils/functionTemplate';
import { logger } from '../../../utils/get-logger';
import { getFunctionsFolder } from '../../../common/fileSystem/local-artifact';
import { METRIC_INVOCATION, METRIC_SUCCESS, METRIC_FAILURE } from 'oci-ide-plugin-base/dist/monitoring/monitoring';
import { Service } from 'oci-ide-plugin-base/dist/monitoring/service';
import { MONITOR } from '../../../common/monitor';


export async function createFunctionFromTemplate(application: OCIApplicationNode, context: vscode.ExtensionContext, treeDataProvider: IOCIProfileTreeDataProvider): Promise<IActionResult> {
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'createFunctionFromTemplate', application.resource.compartmentId!));
    const language = await promptForFunctionLanguage(
        TemplateMappings.getSupportedFunctionLanguages(),
    );

    if (language === undefined) {
        return newCancellation();
    }

    const functionName = (await promptForFunctionName())?.toLowerCase();
    if (functionName === undefined) {
        return newCancellation();
    }

    const functionFolder = getFunctionsFolder(application.id, functionName);
    try {
        const template = new FunctionTemplate(language.id);
        template.writeFiles(functionFolder);
        template.replacePlaceholdersWithValue(functionFolder, [
            { key: '%FUNCTION_NAME%', value: functionName },
        ]);

        //Add new function node
        let newNode = new OCINewFunctionNode(
            {
                name: functionName,
                id: application.id + "_my_application_" + OCIApplicationNode.newFunctionCounter,
                type: OCINewFunctionType.FromTemplate.type,
                displayName: functionName
            },
            ext.api.getCurrentProfile().getProfileName(),
            undefined,
            application,
            vscode.Uri.file(functionFolder));

        OCIApplicationNode.newFunctionCounter += 1;
        OCIApplicationNode.newFunctions.push(newNode);
        ext.treeView.reveal(await newNode.getParentNode()!, { focus: true, select: true, expand: 1 });
        ext.treeDataProvider.refresh(newNode.getParentNode());
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'createFunctionFromTemplate', application.resource.compartmentId!));
    } catch (error: any) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'createFunctionFromTemplate', application.resource.compartmentId!, undefined, '' + error));
        logger().info(error);
        return newError(error);
    }
    return newSuccess();
}
