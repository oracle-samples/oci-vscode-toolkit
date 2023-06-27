/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { QuickPickItem, QuickPickOptions, window } from 'vscode';
import { ext } from '../extension-vars';
import {IOCIProfile} from '../profilemanager/profile';
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

interface ProfileQuickPickItem extends QuickPickItem {
    profileName: string;
}

// prompts user for the profile name
async function promptForProfile (
    allProfiles: IOCIProfile[],
): Promise<string | undefined> {
    const profilePlaceHolderText = localize("profilePlaceHolderText","Select an OCI profile");
    const opts: QuickPickOptions = {
        placeHolder: profilePlaceHolderText,
        ignoreFocusOut: true,
        canPickMany: false,
    };

    const profileList: ProfileQuickPickItem[] = allProfiles.map((p) => {
        return {
            profileName: p.getProfileName(),
            label: `${p.getProfileName()} (${p.getRegionName()})`,
            description: p.getTenancy(),
        };
    });

    return window.showQuickPick(profileList, opts).then((p) => p?.profileName);
}

// Switches the current profile to a different one and returns the newly selected
// profile.
export async function switchProfile(): Promise<IOCIProfile | undefined> {
    const allProfiles = ext.api.getProfiles();

    const profileName = await promptForProfile(allProfiles);
    if (!profileName) {
        return undefined;
    }

    const results: IOCIProfile[] = allProfiles.filter(
        (p: IOCIProfile) => p.getProfileName() === profileName,
    );

    if (results.length === 0) {
        return undefined;
    }
    return results[0];
}
