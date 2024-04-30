/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { QuickPickItem, QuickPickOptions, window } from "vscode";
import { getSubscribedRegions } from '../api/oci-sdk-client';
import { IOCIProfile } from "../profilemanager";
import { ListRegionSubscriptionsResponse } from "oci-identity/lib/response";
import { RegionSubscription } from "oci-identity/lib/model";
import { userFriendlyRegionsMap } from "../regions/fetch-regions";
import { OciExtensionError } from "../errorhandler/oci-plugin-error";
import { getLogger } from "../logger/logging";
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export interface RegionQuickPickItem extends QuickPickItem{
    regionName: string;                                                                                                                                                                                                                                                                                                                                                                          
}
let allRegions: ListRegionSubscriptionsResponse;
const logger = getLogger("oci-vscode-toolkit");

// prompts user for the region name
export async function promptForRegion (profile: IOCIProfile): Promise<string | undefined> {
    const regionPlaceHolderText = localize("regionPlaceHolderText","Select an OCI region");
    const opts: QuickPickOptions = {
        placeHolder: regionPlaceHolderText,
        ignoreFocusOut: true,
        canPickMany: false,
    };
    allRegions = await getSubscribedRegions({profile: profile.getProfileName()});
 
    const regionList: RegionQuickPickItem[] = allRegions.items.map((r) => {
        return {
            regionName: `${r.regionName}` as const,
            label: userFriendlyRegionsMap.get(r.regionName) ? `${userFriendlyRegionsMap.get(r.regionName)}` : `${r.regionName}`,
        } as RegionQuickPickItem;
    });

    regionList.sort((a, b) => a.label.localeCompare(b.label));
    return window.showQuickPick(regionList, opts).then((p) => p?.regionName);
}

// Switches the current region to a different one and returns the newly selected
// region.
export async function switchRegion(profile: IOCIProfile): Promise<RegionSubscription | undefined> {
    try {
        const regionName = await promptForRegion(profile);
        if (!regionName) {
            const invalidRegionErrorMsg = localize("invalidRegionErrorMsg","Region {0} selected from prompt is not valid. Please select a valid region.",regionName);
            throw new OciExtensionError(invalidRegionErrorMsg);
        }
    
        const results: RegionSubscription[] = allRegions.items.filter(
            (p: RegionSubscription) => p.regionName === regionName,
        );
    
        if (results.length === 0) {
            return undefined;
        }
        return results[0];
    } catch (error) {
        const switchRegionErrorMsg = localize("switchRegionErrorMsg","Error in switching region from prompt ");
        logger.error(switchRegionErrorMsg, JSON.stringify(error));
    }
}
