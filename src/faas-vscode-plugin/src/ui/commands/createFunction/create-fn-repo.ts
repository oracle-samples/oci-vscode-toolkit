/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import { ext } from '../../../extensionVars';
import { IOCIProfileTreeDataProvider } from '../../../oci-api';
import { OCIApplicationNode } from "../../tree/nodes/oci-application-node";
import { OCINewFunctionNode, OCINewFunctionType } from '../../tree/nodes/oci-new-function-node';
import { promptForFunctionName, promptForRepositoryUrl } from '../../../ui-helpers/ui-helpers';
import { IActionResult, newCancellation, newError, newSuccess } from '../../../utils/actionResult';
import { gitCloneWithExt } from '../../../common/git/git-clone';
import { logger } from '../../../utils/get-logger';
import { Repository } from '../../../git';
import { getFunctionsFolder } from '../../../common/fileSystem/local-artifact';
import { METRIC_INVOCATION, METRIC_FAILURE, METRIC_SUCCESS } from 'oci-ide-plugin-base/dist/monitoring/monitoring';
import * as nls from 'vscode-nls';
import { Service } from 'oci-ide-plugin-base/dist/monitoring/service';
import { MONITOR } from '../../../common/monitor';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function createFunctionFromCodeRepository(application: OCIApplicationNode, context: vscode.ExtensionContext, treeDataProvider: IOCIProfileTreeDataProvider): Promise<IActionResult> {

    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'createFunctionFromCodeRepository', application.resource.compartmentId!));
    const functionName = (await promptForFunctionName())?.toLowerCase();
    const createFunctionCancellationInfoMsg = localize("createFunctionCancellationInfoMsg", "Creation of function was cancelled");

    if (functionName === undefined) {
        return newCancellation(createFunctionCancellationInfoMsg);
    }

    let repositoryUrl = await promptForRepositoryUrl();
    if (repositoryUrl === undefined) {
        return newCancellation(createFunctionCancellationInfoMsg);
    }
    let repository: Repository | null | undefined;
    const cloneErrorInfoMsg = localize("cloneErrorInfoMsg", "Error in cloning repo.");

    try {
        repository = await gitCloneWithExt(repositoryUrl, getFunctionsFolder(application.id, functionName));
        if (!repository) {
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'gitCloneWithExt', application.resource.compartmentId!));
            return newError(cloneErrorInfoMsg);
        } else {
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'gitCloneWithExt', application.resource.compartmentId!));
        }

    } catch (error) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'createFunctionFromCodeRepository', application.resource.compartmentId!, undefined, '' + error));
        logger().error(`${cloneErrorInfoMsg}: ${error}`);
        return newError(`${cloneErrorInfoMsg}: ${error}`);
    }
    const cloneSuccessInfoMsg = localize("cloneSuccessInfoMsg", "Successfully cloned.");

    vscode.window.showInformationMessage(cloneSuccessInfoMsg, { modal: false });
    var newFunction = new OCINewFunctionNode(
        { name: functionName, id: application.id + "_my_application_" + OCIApplicationNode.newFunctionCounter, type: OCINewFunctionType.FromCodeRepository.type, displayName: functionName },
        ext.api.getCurrentProfile().getProfileName(),
        undefined,
        application,
        repository!.rootUri!,
        repository!
    );
    OCIApplicationNode.newFunctions.push(newFunction);
    newFunction.isGitRepo = true;
    OCIApplicationNode.newFunctionCounter += 1;
    ext.treeView.reveal(await newFunction.getParentNode()!, { focus: true, select: true, expand: 1 });
    ext.treeDataProvider.refresh(newFunction.getParentNode());
    return newSuccess();
}
