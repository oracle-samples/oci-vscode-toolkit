/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { hasFailed, IActionResult, isCanceled } from "../../../utils/actionResult";
import * as vscode from 'vscode';
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function handleResult(retVal: IActionResult) {
    if (isCanceled(retVal)) {
        vscode.window.showWarningMessage(retVal.result, { modal: false });
    } else if (hasFailed(retVal)) {
        vscode.window.showErrorMessage(retVal.result.message, { modal: false });
    } else {
        const createFunctionInfoMsg = localize("createFunctionInfoMsg", "Note: When you are ready to deploy the function, commit the changes and push them to the remote branch. Deployment always fetches the latest commit from the remote branch. Uncommitted changes and local commits are silently ignored.");
        vscode.window.showInformationMessage(createFunctionInfoMsg, { modal: true });
    }
}
