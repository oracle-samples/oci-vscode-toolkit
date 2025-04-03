/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import {
    promptForOPVP,
    promptForOpvpDescription,
    promptForOpvpName,
    promptForOpvpType
} from '../../../ui-helpers/ui-helpers';
import { ext } from '../../../extensionVars';
import { ListOnPremiseVantagePoints } from '../../../api/apmsynthetics';
import { OnPremiseVantagePointSummary } from "oci-apmsynthetics/lib/model";
import { IOCIOpvpCreateInfo } from "../../../resourceinterfaces/ioci-opvp-create-info";

export async function getOpvpList(apmDomainId: string): Promise<Array<OnPremiseVantagePointSummary | undefined> | undefined> {
    const currentProfile = ext.api.getCurrentProfile();
    const profileName = currentProfile.getProfileName();
    return await ListOnPremiseVantagePoints(profileName, apmDomainId);
}

export async function getOpvpInfo(apmDomainId: string): Promise<IOCIOpvpCreateInfo | undefined> {

    const opvpName = await promptForOpvpName();
    if (opvpName === undefined) {
        return undefined;
    }

    const opvpDesc = await promptForOpvpDescription();
    if (opvpDesc === undefined) {
        return undefined;
    }

    return {
        displayName: opvpName,
        description: opvpDesc
    };
}
