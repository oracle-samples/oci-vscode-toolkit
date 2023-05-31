/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import { validateApplicationName, validateFunctionName } from "../utils/validators";
import { IOCIResource, IOCISubnet } from "../api/types";

export async function promptForAppName(
    defaultAppName = 'MyOCIApplication',
): Promise<string | undefined> {
    // Get the app name
    const appNameOpts: vscode.InputBoxOptions = {
        prompt: 'Enter application name:',
        value: defaultAppName,
        ignoreFocusOut: true,
        validateInput: validateApplicationName,
    };
    return vscode.window.showInputBox(appNameOpts);
}

interface VcnQuickPickItem extends vscode.QuickPickItem {
    vcnId?: string;
}

// Prompts for VCN
export async function promptForVCN(
    allVcns: IOCIResource[],
): Promise<string | undefined> {
    const opts: vscode.QuickPickOptions = {
        placeHolder: 'Select a VCN',
        ignoreFocusOut: true,
        canPickMany: false,
    };

    const vcnList: VcnQuickPickItem[] = allVcns.map((m) => {
        return {
            vcnId: m.id,
            label: m.displayName || 'undefined',
            description: m.id || 'undefined',
        };
    });
    return vscode.window
        .showQuickPick(vcnList, opts)
        .then((r) => r?.vcnId);
}

interface SubnetQuickPickItem extends vscode.QuickPickItem {
    subnetId?: string;
}

export async function promptForSubnets(
    allSubnets: IOCISubnet[],
): Promise<string[]> {
    const opts: vscode.QuickPickOptions = {
        placeHolder: 'Select up to 3 subnets',
        ignoreFocusOut: true,
    };

    const subnetList: SubnetQuickPickItem[] = allSubnets.map((s) => {
        return {
            subnetId: s.id,
            label:
                `${s.displayName} (${s.availabilityDomain === undefined ? 'Regional' : ''
                })` || 'undefined',
            description:
                `${s.id} (${s.prohibitPublicIpOnVnic ? 'Private' : 'Public'
                })` || 'undefined',
        };
    });
    return vscode.window
        .showQuickPick<SubnetQuickPickItem>(
            subnetList,
            opts && { canPickMany: true },
        )
        .then((s) => {
            const selectedSubnets: string[] = [];
            s?.forEach((i) => {
                if (i.subnetId) {
                    selectedSubnets.push(i.subnetId);
                }
            });
            return selectedSubnets;
        });
}

export async function promptForFunctionLanguage(
    languages: string[],
): Promise<any | undefined> {
    const langOpts: vscode.QuickPickOptions = {
        placeHolder: 'Select a language for your function',
        ignoreFocusOut: true,
        canPickMany: false,
    };
    return vscode.window.showQuickPick(languages, langOpts);
}

export async function promptForFunctionName(
    defaultFunctionName = 'myfunction',
): Promise<string | undefined> {
    const createNewFuncOpts: vscode.InputBoxOptions = {
        placeHolder: 'Function name',
        prompt: 'Enter your function name',
        value: defaultFunctionName,
        ignoreFocusOut: true,
        validateInput: validateFunctionName,
    };
    return vscode.window.showInputBox(createNewFuncOpts);
}

export async function promptForRepositoryUrl(
): Promise<string | undefined> {

    const repoUrl: vscode.InputBoxOptions = {
        prompt: 'Enter repository URL:',
        ignoreFocusOut: true,
    };
    return vscode.window.showInputBox(repoUrl);
}

export async function promptForFunctionSample(
    samples: string[],
): Promise<any | undefined> {
    const opts: vscode.QuickPickOptions = {
        placeHolder: 'Select a template for your function',
        ignoreFocusOut: true,
        canPickMany: false,
    };
    return vscode.window.showQuickPick(samples, opts);
}
