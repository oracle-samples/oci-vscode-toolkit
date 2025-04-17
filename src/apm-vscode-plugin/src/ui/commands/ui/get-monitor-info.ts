/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import {
    promptForMonitorName,
    promptForPublicVP,
    promptForTarget,
    promptForScriptId,
    promptForUpdatedScriptId,
    promptForUpdatedMonitorName,
    promptForSingleVP,
    promptForTimestamp,
    promptForTimeDurations,
    TimeDurations,
    promptForDate
} from '../../../ui-helpers/ui-helpers';

import { ext } from '../../../extensionVars';
import { listPublicVantagePoints } from '../../../api/apmsynthetics';
import { VantagePointInfo } from "oci-apmsynthetics/lib/model";
import { IOCIMonitorCreateInfo } from "../../../resourceinterfaces/ioci-monitor-create-info";
import { IOCIMonitorUpdateInfo } from '../../../resourceinterfaces/ioci-monitor-update-info';
import { IOCIMonitorResultInfo } from '../../../resourceinterfaces/ioci-monitor-result-info';
import { IOCIMetricDataTimeRangeInfo } from '../../../resourceinterfaces/ioci-metric-data-time-range-info';


export async function getMonitorInfo(apmDomainId: string): Promise<
    IOCIMonitorCreateInfo | undefined
> {
    const currentProfile = ext.api.getCurrentProfile();
    const profileName = currentProfile.getProfileName();

    const monitorName = await promptForMonitorName();
    if (monitorName === undefined) {
        return undefined;
    }

    // var monTypeStr = await promptForMonitorType();   
    // if (monTypeStr === undefined) {
    //     return undefined;
    // }

    const monitorTarget = await promptForTarget();
    if (monitorTarget === undefined) {
        return undefined;
    }

    const scriptId = await promptForScriptId();
    if (scriptId === undefined) {
        return undefined;
    }

    // const monitorInterval = await promptForRepeatIntervalInSeconds();
    // if (monitorInterval === undefined) {
    //     return undefined;
    // }

    const publicVPs = await listPublicVantagePoints(profileName, apmDomainId);
    const vpDisplayNames = await promptForPublicVP(publicVPs);
    if (vpDisplayNames === undefined) {
        return undefined;
    }

    return {
        displayName: monitorName,
        target: monitorTarget,
        vantagePoints: vpDisplayNames,
        scriptId: scriptId
    };
}

export interface VantagePointItem {
    name: string;
    displayName: string;
}

export async function getVPList(apmDomainId: string): Promise<VantagePointItem[]> {
    const currentProfile = ext.api.getCurrentProfile();
    const profileName = currentProfile.getProfileName();

    const publicVPs = await listPublicVantagePoints(profileName, apmDomainId);
    const vpList: VantagePointItem[] = publicVPs.map((m) => {
        return {
            name: m.name,
            displayName: m.displayName
        };
    });
    return vpList;

}

export async function getUpdateMonitorInfo(apmDomainId: string): Promise<IOCIMonitorUpdateInfo | undefined> {
    const currentProfile = ext.api.getCurrentProfile();
    const profileName = currentProfile.getProfileName();

    const monitorName = await promptForUpdatedMonitorName();
    if (monitorName === undefined) {
        return undefined;
    }

    const monitorTarget = await promptForTarget();
    if (monitorTarget === undefined) {
        return undefined;
    }

    const scriptId = await promptForUpdatedScriptId();
    if (scriptId === undefined) {
        return undefined;
    }

    const publicVPs = await listPublicVantagePoints(profileName, apmDomainId);
    const vpDisplayNames = await promptForPublicVP(publicVPs);
    if (vpDisplayNames === undefined) {
        return undefined;
    }

    return {
        displayName: monitorName,
        target: monitorTarget,
        vantagePoints: vpDisplayNames,
        scriptId: scriptId
    };
}

export async function getMonitorResultInfo(apmDomainId: string, vantagePoints: Array<VantagePointInfo>): Promise<IOCIMonitorResultInfo | undefined> {
    const executionTime = await promptForTimestamp();
    if (executionTime === undefined || executionTime == '') {
        return undefined;
    }

    const vpDisplayName = await promptForSingleVP(vantagePoints);
    if (vpDisplayName === undefined || vpDisplayName == '') {
        return undefined;
    }

    return {
        vantagePoint: vpDisplayName,
        executionTime: executionTime,
    };
}

export async function getMetricDataPointsTimeRangeInfo(): Promise<IOCIMetricDataTimeRangeInfo | undefined> {
    const selectedTime = await promptForTimeDurations(Object.values(TimeDurations));
    if (selectedTime === undefined || selectedTime == '') {
        return undefined;
    }

    var startDate = new Date(new Date().toUTCString());
    var endDate = new Date(startDate.toUTCString());
    switch (selectedTime) {
        case TimeDurations.FifteenMin: {
            startDate.setUTCMinutes(startDate.getUTCMinutes() - 15);
            break;
        }
        case TimeDurations.ThirtyMin: {
            startDate.setUTCMinutes(startDate.getUTCMinutes() - 30);
            break;
        }
        case TimeDurations.SixtyMin: {
            startDate.setUTCMinutes(startDate.getUTCMinutes() - 60);
            break;
        }
        case TimeDurations.EightHr: {
            startDate.setUTCHours(startDate.getUTCHours() - 8);
            break;
        }
        case TimeDurations.TwentyFourHr: {
            startDate.setDate(startDate.getUTCDate() - 1);
            break;
        }
        case TimeDurations.OneWeek: {
            startDate.setDate(startDate.getUTCDate() - 7);
            break;
        }
        case TimeDurations.Custom: {
            let startDateStr = await promptForDate(startDate.toUTCString(), ' start date');
            if (startDateStr === undefined) {
                return undefined;
            }
            startDate = new Date(startDateStr);

            let endDateStr = await promptForDate(startDate.toUTCString(), ' end date');
            if (endDateStr === undefined) {
                return undefined;
            }
            endDate = new Date(endDateStr);
            break;
        }
    }

    return {
        startDate,
        endDate
    };
}

