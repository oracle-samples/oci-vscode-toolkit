/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as nls from 'vscode-nls';
import {
    window, StatusBarItem,
    StatusBarAlignment
} from 'vscode';
import { createFullCommandName } from '../util/resources';
import { getCloudShellConfigIfExists } from '../profilemanager/profile-config';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function setupStatusBar(commandName: string): Promise<StatusBarItem> {

    let msg: string | undefined;

    if (commandName === 'switchRegion') {
        msg = localize("switchRegionMsg", "The current region used by the OCI Toolkit.\n\nClick this status bar item to change to different region.");
    }
    else if (commandName === 'switchProfile') {
        msg = localize("switchProfileMsg", "The current profile used by the OCI Toolkit.\n\nClick this status bar item to use different profile.");
    }
    const command = createFullCommandName(commandName);
    const statusBarItem = window.createStatusBarItem(StatusBarAlignment.Right, 100);
    statusBarItem.command = command;
    statusBarItem.tooltip = msg;
    if (!getCloudShellConfigIfExists()) {
        statusBarItem.show();
    }
    return statusBarItem;
}

export function updateProfileStatusBar(statusBarItem: StatusBarItem, profile?: string): void {
    // Check if Profile Exists.
    const profileText = localize("profileText", "Profile");
    const notConnectedText = localize("notConnectedText", "(not connected)");
    statusBarItem.text = profile ? `OCI: ${profileText}:${profile}` : `OCI: ${notConnectedText}`;
}

export function updateRegionStatusBar(changeRegionBar: StatusBarItem, region?: string): void {
    const regionText = localize("regionText", "Region");
    const notConnectedText = localize("notConnectedText", "(not connected)");
    changeRegionBar.text = region ? `${regionText}: ${region}` : `OCI: ${notConnectedText}`;
}
