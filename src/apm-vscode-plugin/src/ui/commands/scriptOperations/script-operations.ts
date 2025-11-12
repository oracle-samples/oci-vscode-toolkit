/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import * as nls from 'vscode-nls';
import * as fs from 'fs';
import { ext } from '../../../extensionVars';
import {
    IActionResult,
    newCancellation,
    newError,
    newSuccess,
} from '../../../utils/actionResult';
import { createScript, getScript, getScriptDetailsInOutput, updateScript } from "../../../api/apmsynthetics";
import { ContentTypes } from 'oci-apmsynthetics/lib/model';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function webviewCreateNewScript(apmDomainId: string, scriptNname: string, scriptContent: any, contentFileName: string,
    contentType: ContentTypes, panel: vscode.WebviewPanel): Promise<IActionResult> {
    return createNewScript(apmDomainId, scriptNname, scriptContent, contentFileName, contentType, panel);
}

export async function createNewScript(apmDomainId: string, displayName: string, scriptContent: any, contentFileName: string,
    contentType: ContentTypes, panel: vscode.WebviewPanel | undefined): Promise<IActionResult> {
    const currentProfile = ext.api.getCurrentProfile();
    try {
        const r = await createScript(
            currentProfile.getProfileName(),
            apmDomainId,
            displayName,
            scriptContent,
            contentFileName,
            contentType
        );
        const operationSuccessMessage = localize("operationCreateSuccessMessage", 'Script creation is successful.');
        vscode.window.showInformationMessage(
            operationSuccessMessage, { modal: false }
        );
        if (panel !== undefined) {
            panel.dispose();
        }
        return newSuccess(r);
    } catch (e) {
        //return newCancellation()
        let errorMessage = localize("scriptCreateErrorMessage", 'Error occurred while creating script.');
        if (typeof e === "string") {
            vscode.window.showErrorMessage(e.toUpperCase());
            errorMessage = e.toUpperCase();
        } else if (e instanceof Error) {
            vscode.window.showErrorMessage(e.message);
            errorMessage = e.message;
        }
        //throw e;
        return newError(errorMessage);
    }
}

export async function getScriptContent(apmDomainId: string, scriptId: string, outputChannel: vscode.OutputChannel): Promise<IActionResult> {
    const currentProfile = ext.api.getCurrentProfile();
    const r = getScript(currentProfile.getProfileName(), apmDomainId!, scriptId);
    const scriptFileName = (await r).contentFileName;
    if (scriptFileName == undefined) {
        vscode.window.showErrorMessage(localize('scriptFileNameNotFound', 'Script file name not found, cancelling operation'));
        return newCancellation();
    }
    const scriptContent = (await r).content;
    if (scriptContent == undefined) {
        vscode.window.showErrorMessage(localize('scriptContentNotFound', 'Script content not found, cancelling operation'));
        return newCancellation();
    }

    writeToFile(scriptContent, scriptFileName, 'utf8', outputChannel);
    return newSuccess(r);
}

export async function webviewEditNewScript(apmDomainId: string, scriptName: string, scriptId: string, scriptContent: any, panel: vscode.WebviewPanel): Promise<IActionResult> {
    return editScript(apmDomainId, scriptName, scriptId, scriptContent, panel);
}

export async function editScript(apmDomainId: string, scriptName: string, scriptId: string,
    scriptContent: string, panel: vscode.WebviewPanel | undefined): Promise<IActionResult> {
    try {
        const currentProfile = ext.api.getCurrentProfile();
        const r = await updateScript(currentProfile.getProfileName(), apmDomainId!, scriptId, scriptName, scriptContent);
        const operationSuccessMessage = localize("operationUpdateSuccessMessage", 'Script updation is successful.');
        vscode.window.showInformationMessage(
            operationSuccessMessage, { modal: false }
        );
        if (panel !== undefined) {
            panel.dispose();
        }
        return newSuccess(r);
    } catch (e) {
        //return newCancellation();
        let errorMessage = localize("scriptUpdateErrorMessage", 'Error occurred while updating script.');
        if (typeof e === "string") {
            vscode.window.showErrorMessage(e.toUpperCase());
            errorMessage = e.toUpperCase();
        } else if (e instanceof Error) {
            vscode.window.showErrorMessage(e.message);
            errorMessage = e.message;
        }
        //throw e;
        return newError(errorMessage);
    }
}

export function writeToFile(contentToWrite: string, fileName: string, encoding: fs.WriteFileOptions,
    outputChannel: vscode.OutputChannel) {

    vscode.window.showSaveDialog({ "defaultUri": vscode.Uri.file(fileName) }).then(fileInfo => {
        if (fileInfo === undefined) {
            vscode.window.showErrorMessage(localize('filePathRetrieveError', 'Error: Unable to retrieve file path for saving file'));
            return newCancellation();
        }
        fs.writeFile(fileInfo.path, contentToWrite, encoding, function (err) {
            if (err) {
                vscode.window.showErrorMessage(localize('fileDownloadFailure', 'Error: {0}', err.message));
            } else {
                vscode.window.showInformationMessage(localize('fileDownloadSuccess', 'File download is starting....'));
            }
        });
    });
}

export async function getScriptDetails(scriptId: string, apmDomainId: string,
    panel: vscode.WebviewPanel, context: vscode.ExtensionContext): Promise<IActionResult> {
    const currentProfile = ext.api.getCurrentProfile();
    const r = getScriptDetailsInOutput(apmDomainId, scriptId, currentProfile.getProfileName(), panel, context);
    return newSuccess(r);
}

