/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import { getFunctionsFolder } from '../../common/fileSystem/local-artifact';
import { gitCloneWithExt } from '../../common/git/git-clone';
import { ext } from '../../extensionVars';
import { Repository } from '../../git';
import { FileExplorerItem, IOCIProfileTreeDataProvider, OCIFileExplorerNode } from "../../oci-api";
import { OCIFunctionNode } from '../tree/nodes/oci-function-node';
import { promptForRepositoryUrl } from '../../ui-helpers/ui-helpers';
import { IActionResult, newCancellation, newError, newSuccess } from '../../utils/actionResult';
import { logger } from '../../utils/get-logger';
import * as nls from 'vscode-nls';
import { METRIC_SUCCESS, METRIC_FAILURE } from 'oci-ide-plugin-base/dist/monitoring/monitoring';
import { Service } from 'oci-ide-plugin-base/dist/monitoring/service';
import { MONITOR } from '../../common/monitor';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function editFunction(fn: OCIFunctionNode, treeDataProvider: IOCIProfileTreeDataProvider): Promise<IActionResult> {

    let repositoryUrl = await promptForRepositoryUrl();
    if (repositoryUrl === undefined) {
        return newCancellation();
    }
    let repository: Repository | null | undefined;
    const cloneErrorInfoMsg = localize("cloneErrorInfoMsg", "Error in cloning repo.");

    try {
        repository = await gitCloneWithExt(repositoryUrl, getFunctionsFolder(fn.parent!.id, fn.func.displayName!));
        if (!repository) {
            return newError(`${cloneErrorInfoMsg}`);
        }
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'gitCloneWithExt', fn.func.compartmentId!, fn.func.id));
        fn.repository = repository;
    } catch (error) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'gitCloneWithExt', fn.func.compartmentId!, fn.func.id, '' + error));
        logger().error(`${cloneErrorInfoMsg}: ${error}`);
        return newError(`${cloneErrorInfoMsg}: ${error}`);
    }
    const cloneSuccessInfoMsg = localize("cloneSuccessInfoMsg", "Successfully cloned.");
    vscode.window.showInformationMessage(cloneSuccessInfoMsg);
    let pathToDir: FileExplorerItem = { uri: repository!.rootUri, type: vscode.FileType.Directory };
    let fileExplorerNodes: OCIFileExplorerNode[] = await ext.api.createFileExplorer(pathToDir);
    fileExplorerNodes.forEach(element => {
        element.parent = fn;
        OCIFunctionNode.newFunctions.push(element);
    });
    treeDataProvider.refresh(fn);
    ext.treeView.reveal(fn, { focus: true, select: true, expand: 1 });
    fn.isGitRepo = true;
    return newSuccess();
}
