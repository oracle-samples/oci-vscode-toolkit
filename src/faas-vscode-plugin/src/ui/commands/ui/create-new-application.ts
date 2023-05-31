/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import {
    promptForAppName,
    promptForVCN,
    promptForSubnets,
} from '../../../ui-helpers/ui-helpers';
import { ext } from '../../../extensionVars';
import { getVCNs, getSubnets } from '../../../api/vcn';
import { IOCIFnAppCreateInfo } from "../../../resourceinterfaces/ioci-fn-app-create-info";

export async function createNewApplication(compartmentId: string): Promise<
    IOCIFnAppCreateInfo | undefined
> {
    const currentProfile = ext.api.getCurrentProfile();
    const profileName = currentProfile.getProfileName();

    const appName = await promptForAppName();
    if (appName === undefined) {
        return undefined;
    }

    const allVcns = await getVCNs(profileName, compartmentId);
    const vcnId = await promptForVCN(allVcns);
    if (vcnId === undefined) {
        return undefined;
    }

    const allSubnets = await getSubnets(profileName, compartmentId, vcnId);
    const subnetIds = await promptForSubnets(allSubnets);
    if (subnetIds === undefined) {
        return undefined;
    }

    return {
        displayName: appName,
        subnetIds,
    };
}
