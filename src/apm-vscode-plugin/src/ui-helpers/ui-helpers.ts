/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import {
    validateMonitorName, validateMonitorType, validateWorkerName, validateOpvpName, validateOpvpDescription, validateOpvpId,
    validateInstallationDir, validateWorkerTarPath,
    validateOpvpType, validateWorkerId, validateRepeatIntervalInSeconds, validateScriptId, validateScriptName,
    validateTimestamp,
    validateDate
} from "../utils/validators";
import { PublicVantagePointSummary, OnPremiseVantagePointSummary } from "oci-apmsynthetics/lib/model";
import * as nls from 'vscode-nls';
import { IOCIWorkerInfo } from "../resourceinterfaces/ioci-worker-create-info";

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export enum TimeDurations {
    FifteenMin = "Last 15 minutes",
    ThirtyMin = "Last 30 minutes",
    SixtyMin = "Last 60 minutes",
    EightHr = "Last 8 hours",
    TwentyFourHr = "Last 24 hours",
    OneWeek = "Last one week",
    Custom = "Custom"
}


export enum ContainerType {
    COLIMA = "Colima",
    DOCKER = "Docker",
    PODMAN = "Podman",
}

export async function promptForMonitorName(
): Promise<string | undefined> {
    // Get the monitor name
    const monitorNameOpts: vscode.InputBoxOptions = {
        prompt: localize('monitorNamePrompt', 'Enter monitor name:'),
        ignoreFocusOut: true,
        validateInput: validateMonitorName,
    };
    return vscode.window.showInputBox(monitorNameOpts);
}


export async function promptForUpdatedMonitorName(
): Promise<string | undefined> {
    // Get the monitor name
    const monitorNameOpts: vscode.InputBoxOptions = {
        prompt: localize('monitorNamePrompt', 'Enter monitor name:'),
        ignoreFocusOut: true
    };
    return vscode.window.showInputBox(monitorNameOpts);
}

// Prompts for monitor type
export async function promptForMonitorType(
): Promise<string | undefined> {
    const monitorTypeOpts: vscode.InputBoxOptions = {
        prompt: localize('monitorTypePrompt', 'Enter monitor type:'),
        ignoreFocusOut: true,
        validateInput: validateMonitorType,
    };
    return vscode.window.showInputBox(monitorTypeOpts);
}

// Prompts for target
export async function promptForTarget(
): Promise<string | undefined> {
    const monitorTargetOpts: vscode.InputBoxOptions = {
        prompt: localize('monitorTarget', 'Enter target:'),
        ignoreFocusOut: true,
    };
    return vscode.window.showInputBox(monitorTargetOpts);
}

// Prompts for worker name
export async function promptForWorkerName(): Promise<string | undefined> {
    // Get the worker name
    const workerNameOpts: vscode.InputBoxOptions = {
        prompt: localize('workerNamePrompt', 'Enter worker name:'),
        ignoreFocusOut: true,
        validateInput: validateWorkerName,
    };
    return vscode.window.showInputBox(workerNameOpts);
}

// prompts for worker's priority
export async function promptForPriority(
    priority: string[],
): Promise<any | undefined> {
    const langOpts: vscode.QuickPickOptions = {
        placeHolder: localize('priorityPrompt', 'Set priority for worker. Priority number 10 is lowest and 1 is highest.'),
        ignoreFocusOut: true,
        canPickMany: false,
    };
    return vscode.window.showQuickPick(priority, langOpts);
}

// prompts for worker's capability
export async function promptForCapability(
    capability: string[],
): Promise<any | undefined> {
    const langOpts: vscode.QuickPickOptions = {
        placeHolder: localize('workerCapabilityPrompt', 'Select worker capability'),
        ignoreFocusOut: true,
        canPickMany: false,
    };
    return vscode.window.showQuickPick(capability, langOpts);
}

// prompts for authorization type
export async function promptForAuthType(
    authType: string[],
): Promise<any | undefined> {
    const langOpts: vscode.QuickPickOptions = {
        placeHolder: localize('workerAuthTypePrompt', 'Select authorization type'),
        ignoreFocusOut: true,
        canPickMany: false,
    };
    return vscode.window.showQuickPick(authType, langOpts);
}

// prompts for worker tar path
export async function promptForWorkerTarPath(
    defaultPath = '',
): Promise<string | undefined> {
    const workerTarPathOpts: vscode.InputBoxOptions = {
        prompt: localize('workerTarPathPrompt', 'Enter downloaded worker tar file path:'),
        value: defaultPath,
        ignoreFocusOut: true,
        validateInput: validateWorkerTarPath,
    };
    return vscode.window.showInputBox(workerTarPathOpts);
}

// prompts for installation directory
export async function promptForInstallationDirectory(
    defaultPath = '',
): Promise<string | undefined> {
    const installationDirOpts: vscode.InputBoxOptions = {
        prompt: localize('installationPathPrompt', 'Enter base path for installing worker:'),
        value: defaultPath,
        ignoreFocusOut: true,
        validateInput: validateInstallationDir,
    };
    return vscode.window.showInputBox(installationDirOpts);
}

//Prompts for APM api server url
export async function promptForApmServerUrl(
    apiUrl: string[],
): Promise<any | undefined> {
    const langOpts: vscode.QuickPickOptions = {
        placeHolder: localize('synApiServerPrompt', 'Select APM synthetic api server'),
        ignoreFocusOut: true,
        canPickMany: false,
    };
    return vscode.window.showQuickPick(apiUrl, langOpts);
}

// Prompts for apm domain data key
export async function promptForDataKey(
    dataKeys: string[],
): Promise<any | undefined> {
    const langOpts: vscode.QuickPickOptions = {
        placeHolder: localize('apmDataKeyPrompt', 'Select a data key for apm domain'),
        ignoreFocusOut: true,
        canPickMany: false,
    };
    return vscode.window.showQuickPick(dataKeys, langOpts);
}

// Prompts for container-type

export async function promptForContainerType(
    containerTypes: string[],
): Promise<string | undefined> {
    const opts: vscode.QuickPickOptions = {
        placeHolder: localize('containerTypePrompt', 'Select container type'),
        ignoreFocusOut: true
    };

    const containerTypeList: ContainerTypeQuickPickItem[] = containerTypes.map((m) => {
        return {
            containerType: m,
            label: m || 'undefined',
        };
    });
    return vscode.window
        .showQuickPick(containerTypeList, opts && { canPickMany: false },)
        .then((ctype) => {
            let selectedContainer: string = "";
            if (ctype?.containerType) {
                selectedContainer = ctype?.containerType;
            }
            return selectedContainer;
        });
}

// Prompts for on premise vantage point
export async function promptForOPVPInput(
    publicVPs: PublicVantagePointSummary[],
    opVPs: OnPremiseVantagePointSummary[],
    isEdit: boolean
): Promise<Array<string> | undefined> {
    const opts: vscode.QuickPickOptions = {
        placeHolder: localize('opvpPrompt', 'Select an on premise vantage point'),
        ignoreFocusOut: true,
        canPickMany: false
    };

    const modifiedVantagepointsArray: any = [];
    publicVPs.map((m) => {
        modifiedVantagepointsArray.push({ ...m });
    });
    opVPs.map((m) => {
        let sum = 0;
        //console.log("item: " + JSON.stringify(m));
        m.workersSummary?.availableCapabilities?.map((workercapability: any) => {
            workercapability?.capability.split(",").map((type: any) => {
                const str: string = type.replace(/[\[\s\]']+/g, "");
                sum = sum + workercapability?.count;
            });
            //if (sum > 0)
            modifiedVantagepointsArray.push({ ...m, totalMonitorType: sum });
            console.log("item: " + m.displayName + ", sum: " + sum);
            //else if (sum >= 0 &&isEdit)
        });
    });
    const vpList: VantagePointQuickPickItem[] = modifiedVantagepointsArray.forEach((element: any) => {
        return {
            vpInternalName: element?.name || 'undefined',
            label: element?.displayName || 'undefined',
        };
    });
    return vscode.window
        .showQuickPick(vpList, opts && { canPickMany: false },)
        .then((vp) => {
            const selectedVPs: Array<string> = [];
            if (vp?.vpInternalName) {
                selectedVPs.push(vp?.vpInternalName);
            }
            return selectedVPs;
        });
}

export async function promptForOPVP(
    opVPs: OnPremiseVantagePointSummary[],
): Promise<Array<IOCIWorkerInfo> | undefined> {
    const opts: vscode.QuickPickOptions = {
        placeHolder: localize('opvpPrompt', 'Select an on premise vantage point'),
        ignoreFocusOut: true,
        canPickMany: false
    };

    const vpList: OpVantagePointQuickPickItem[] = opVPs.map((m) => {
        return {
            ocid: m.id,
            vpInternalName: m.name,
            label: m.displayName || 'undefined',
        };
    });

    return vscode.window
        .showQuickPick(vpList, opts && { canPickMany: false },)
        .then((vp) => {
            const selectedVPs: Array<any> = [];
            if (vp?.vpInternalName) {
                selectedVPs.push(vp);
            }
            return selectedVPs;
        });
}

// Prompts for opvp type
export async function promptForOpvpType(
): Promise<string | undefined> {
    const opvpTypeOpts: vscode.InputBoxOptions = {
        prompt: localize('opvpTypePrompt', 'Enter opvp type:'),
        ignoreFocusOut: true,
        validateInput: validateOpvpType,
    };
    return vscode.window.showInputBox(opvpTypeOpts);
}

export async function promptForOpvpName(
): Promise<string | undefined> {
    // Get the opvp name
    const opvpNameOpts: vscode.InputBoxOptions = {
        prompt: localize('opvpNamePrompt', 'Enter on premise vantage point name:'),
        ignoreFocusOut: true,
        validateInput: validateOpvpName,
    };
    return vscode.window.showInputBox(opvpNameOpts);
}

// Prompts for opvp id
export async function promptForOpvpDescription(
): Promise<string | undefined> {
    const OpvpIdOpts: vscode.InputBoxOptions = {
        prompt: localize('opvpId', 'Enter opvp description:'),
        ignoreFocusOut: true,
        validateInput: validateOpvpDescription,
    };
    return vscode.window.showInputBox(OpvpIdOpts);
}

// Prompts for worker id
export async function promptForWorkerId(
): Promise<string | undefined> {
    const WorkerIdOpts: vscode.InputBoxOptions = {
        prompt: localize('workerId', 'Enter worker ocid:'),
        ignoreFocusOut: true,
        validateInput: validateWorkerId,
    };
    return vscode.window.showInputBox(WorkerIdOpts);
}

// Prompts for opvp id
export async function promptForOpvpId(
): Promise<string | undefined> {
    const OpvpIdOpts: vscode.InputBoxOptions = {
        prompt: localize('opvpId', 'Enter opvp ocid:'),
        ignoreFocusOut: true,
        validateInput: validateOpvpId,
    };
    return vscode.window.showInputBox(OpvpIdOpts);
}

// Prompts for script id
export async function promptForScriptId(
): Promise<string | undefined> {
    const scriptOpts: vscode.InputBoxOptions = {
        prompt: localize('scriptId', 'Enter Script OCID:'),
        ignoreFocusOut: true,
        validateInput: validateScriptId,
    };
    return vscode.window.showInputBox(scriptOpts);
}

export async function promptForUpdatedScriptId(
): Promise<string | undefined> {
    const scriptOpts: vscode.InputBoxOptions = {
        prompt: localize('scriptId', 'Enter Script OCID:'),
        ignoreFocusOut: true
    };
    return vscode.window.showInputBox(scriptOpts);
}

// Prompts for RepeatIntervalInSeconds
export async function promptForRepeatIntervalInSeconds(
    repeatIntervalInSeconds = '300',
): Promise<string | undefined> {
    const repeatIntervalInSecondsOpts: vscode.InputBoxOptions = {
        prompt: localize('repeatIntervalInSeconds', 'Enter repeat interval in seconds:'),
        value: repeatIntervalInSeconds,
        ignoreFocusOut: true,
        validateInput: validateRepeatIntervalInSeconds,
    };
    return vscode.window.showInputBox(repeatIntervalInSecondsOpts);
}

export async function promptForScriptName(
): Promise<string | undefined> {
    // Get the script name
    const scriptNameOpts: vscode.InputBoxOptions = {
        prompt: localize('scriptNamePrompt', 'Enter script name:'),
        ignoreFocusOut: true,
        validateInput: validateScriptName
    };
    return vscode.window.showInputBox(scriptNameOpts);
}

export async function promptForUpdatedScriptName(
): Promise<string | undefined> {
    // Get the script name
    const scriptNameOpts: vscode.InputBoxOptions = {
        prompt: localize('scriptNamePrompt', 'Enter script name, leave blank if no change required:'),
        ignoreFocusOut: true
    };
    return vscode.window.showInputBox(scriptNameOpts);
}

export async function promptForScript(
): Promise<vscode.Uri[] | undefined> {
    const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: 'Select script file, select cancel if no change is required: '
    };

    return vscode.window.showOpenDialog(options);
}

export async function promptForCreateMonitorFile(
): Promise<vscode.Uri[] | undefined> {
    const options: vscode.OpenDialogOptions = {
        canSelectMany: false,
        openLabel: 'Select file'
    };

    return vscode.window.showOpenDialog(options);
}

interface VantagePointQuickPickItem extends vscode.QuickPickItem {
    vpInternalName?: string;
}

interface OpVantagePointQuickPickItem extends VantagePointQuickPickItem {
    ocid: string,
    vpInternalName?: string;
}

interface ContainerTypeQuickPickItem extends vscode.QuickPickItem {
    containerType?: string
}

interface TimeDurationQuickPickItem extends vscode.QuickPickItem {
    timeDuration?: string;
}

// Prompts for public vantage point
export async function promptForPublicVP(
    publicVPs: PublicVantagePointSummary[],
): Promise<Array<string> | undefined> {
    const opts: vscode.QuickPickOptions = {
        placeHolder: localize('publicVPPrompt', 'Select a public vantage point'),
        ignoreFocusOut: true
    };

    const vpList: VantagePointQuickPickItem[] = publicVPs.map((m) => {
        return {
            vpInternalName: m.name,
            label: m.displayName || 'undefined',
        };
    });
    return vscode.window
        .showQuickPick(vpList, opts && { canPickMany: true },)
        .then((vps) => {
            const selectedVPs: Array<string> = [];
            vps?.forEach((i) => {
                if (i.vpInternalName) {
                    selectedVPs.push(i.vpInternalName);
                }
            });
            return selectedVPs;
        });
}

// Prompts for public vantage point
export async function promptForSingleVP(
    publicVPs: PublicVantagePointSummary[],
): Promise<string | undefined> {
    const opts: vscode.QuickPickOptions = {
        placeHolder: localize('publicVPPrompt', 'Select a public vantage point'),
        ignoreFocusOut: true
    };

    const vpList: VantagePointQuickPickItem[] = publicVPs.map((m) => {
        return {
            vpInternalName: m.name,
            label: m.displayName || 'undefined',
        };
    });
    return vscode.window
        .showQuickPick(vpList, opts && { canPickMany: false },)
        .then((vp) => {
            let selectedVP: string = "";
            if (vp?.vpInternalName) {
                selectedVP = vp?.vpInternalName;
            }
            return selectedVP;
        });
}

export async function promptForTimeDurations(
    timeDurations: string[],
): Promise<string | undefined> {
    const opts: vscode.QuickPickOptions = {
        placeHolder: localize('timeDurationsPrompt', 'Select time'),
        ignoreFocusOut: true
    };

    const timeDurationList: TimeDurationQuickPickItem[] = timeDurations.map((m) => {
        return {
            timeDuration: m,
            label: m || 'undefined',
        };
    });
    return vscode.window
        .showQuickPick(timeDurationList, opts && { canPickMany: false },)
        .then((time) => {
            let selectedTime: string = "";
            if (time?.timeDuration) {
                selectedTime = time?.timeDuration;
            }
            return selectedTime;
        });
}

export async function promptForTimestamp(
): Promise<string | undefined> {
    const timestamp: vscode.InputBoxOptions = {
        prompt: localize('timestamp', 'Enter timestamp (epoch) from \'Get execution results\' command to get the result data:'),
        ignoreFocusOut: true,
        validateInput: validateTimestamp,
    };
    return vscode.window.showInputBox(timestamp);
}

export async function promptForDate(
    defaultValue: string,
    promptMsg: string
): Promise<string | undefined> {
    const date: vscode.InputBoxOptions = {
        prompt: localize('date', 'Enter {0}', promptMsg),
        ignoreFocusOut: true,
        value: defaultValue,
        validateInput: validateDate,
    };
    return vscode.window.showInputBox(date);
}

