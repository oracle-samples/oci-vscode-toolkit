/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import {
    promptForScriptName,
    promptForScript,
    promptForUpdatedScriptName
} from '../../../ui-helpers/ui-helpers';
import * as vscode from 'vscode';
import { ext } from '../../../extensionVars';
import { IOCIScriptCreateInfo } from "../../../resourceinterfaces/ioci-script-create-info";
import { IOCIScriptUpdateInfo } from '../../../resourceinterfaces/ioci-script-update-info';
import { listScripts } from '../../../api/apmsynthetics';


export async function getScriptInfo(): Promise<IOCIScriptCreateInfo | undefined> {
    const scriptName = await promptForScriptName();
    if (scriptName === undefined) {
        return undefined;
    }

    const scriptFile = await promptForScript();
    if (scriptFile === undefined) {
        return undefined;
    }

    const scriptContent = (await vscode.workspace.fs.readFile(scriptFile[0])).toString();

    return {
        displayName: scriptName,
        content: scriptContent
    };
}

export async function getUpdateScriptInfo(): Promise<IOCIScriptUpdateInfo | undefined> {
    const scriptName = await promptForUpdatedScriptName();
    const scriptFile = await promptForScript();
    let scriptContent = undefined;
    if (scriptFile !== undefined) {
        scriptContent = (await vscode.workspace.fs.readFile(scriptFile[0])).toString();
    }

    return {
        displayName: scriptName,
        content: scriptContent
    };
}

export interface ScriptItem {
    scriptId: string;
    scriptName: string;
}

export async function getScriptsList(apmDomainId: string): Promise<ScriptItem[]> {
    const currentProfile = ext.api.getCurrentProfile();
    const profileName = currentProfile.getProfileName();

    const scriptSummaries = await listScripts(apmDomainId, profileName);
    const scriptsList: ScriptItem[] = scriptSummaries.map((m) => {
        return {
            scriptId: m.id,
            scriptName: m.displayName
        };
    });
    return scriptsList;
}




