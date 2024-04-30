/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';

import { Regions } from '../regions/fetch-regions';
import { validateProfileName } from '../util/validators';
import {
    ResourceIconMapping,
    IBasicResourceNodeInfo,
} from './resource-mapping';
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

const regionQuickPickItems = (): vscode.QuickPickItem[] => {
    return Regions.map((r) => {
        return { id: r.name, label: r.name };
    });
};

export async function promptForRegion(): Promise<any> {
    const placeHolderText = localize("regionPromptPlaceHolderText", "Select a region your account is in");
    const langOpts: vscode.QuickPickOptions = {
        placeHolder: placeHolderText,
        ignoreFocusOut: true,
        canPickMany: false,
    };
    return vscode.window
        .showQuickPick(regionQuickPickItems(), langOpts)
        .then((item) => {
            return item?.label;
        });
}

export async function promptForProfileName(): Promise<string | undefined> {
    const profilePromptMsg = localize("profilePromptMsg", "Enter name for this profile");
    const placeHolderText = localize("profilePromptPlaceHolderText", "My Profile");
    const opts: vscode.InputBoxOptions = {
        prompt: profilePromptMsg,
        placeHolder: placeHolderText,
        ignoreFocusOut: true,
        validateInput: validateProfileName,
    };
    return vscode.window.showInputBox(opts);
}

interface ResourceQuickPickItem extends vscode.QuickPickItem {
    resource: IBasicResourceNodeInfo;
}

const ociResourcesQuickPickItems = (
    pickedItemIds: string[],
): ResourceQuickPickItem[] => {
    const sorted = [...ResourceIconMapping].sort((a, b) =>
        a.id > b.id ? 1 : -1,
    );
    return sorted.map((r: IBasicResourceNodeInfo) => {
        const pickedId: string | undefined = pickedItemIds.find(
            (i) => i === r.id,
        );

        return { label: r.name, resource: r, picked: Boolean(pickedId) };
    });
};

export async function promptForResourceSelection(
    pickedItemIds: string[],
): Promise<IBasicResourceNodeInfo[] | undefined> {
    const placeHolderText = localize("selectResourcePlaceHolderText", "Select resources to display in the tree view");
    const opts: vscode.QuickPickOptions = {
        placeHolder: placeHolderText,
        ignoreFocusOut: true,
    };
    
    const resourceList = ociResourcesQuickPickItems(pickedItemIds);
    return vscode.window
        .showQuickPick<ResourceQuickPickItem>(
            resourceList,
            opts && { canPickMany: true },
        )
        .then((s) => {
            const selected: IBasicResourceNodeInfo[] = [];
            if (s === undefined) {
                return s;
            }
            s?.forEach((r: ResourceQuickPickItem) => {
                selected.push(r.resource);
            });
            return selected;
        });
}
