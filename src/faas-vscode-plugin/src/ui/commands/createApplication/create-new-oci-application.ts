/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { ext } from '../../../extensionVars';
import {
    IActionResult,
    newCancellation,
    newSuccess,
} from '../../../utils/actionResult';
import { createNewApplication } from '../ui/create-new-application';
import { createOCIApplication } from "../../../api/function";

export async function createNewOCIApplication(compartmentId: string): Promise<IActionResult> {
    const appInfo = await createNewApplication(compartmentId);
    if (appInfo === undefined) {
        return newCancellation();
    }

    const { displayName, subnetIds } = appInfo;
    const currentProfile = ext.api.getCurrentProfile();
    const r = await createOCIApplication(
        currentProfile.getProfileName(),
        compartmentId,
        displayName,
        subnetIds,
    );
    return newSuccess(r);
}
