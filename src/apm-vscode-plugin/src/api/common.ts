/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as ociCommon from "oci-common";
import { METRIC_SUCCESS, METRIC_FAILURE } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import { MONITOR } from "../common/monitor";
import { ext } from '../extensionVars';

// Client retry config
export const clientConfiguration: ociCommon.ClientConfiguration = {
    retryConfiguration: {
        terminationStrategy: new ociCommon.MaxAttemptsTerminationStrategy(3),
        delayStrategy: new ociCommon.ExponentialBackoffDelayStrategy(30),
        retryCondition: (error: { statusCode: number; }) => { return error.statusCode === (409 || 429 || 500 || 502 || 503 || 504); }
    }
};

export async function getAuthProvider(profile: string): Promise<ociCommon.AuthenticationDetailsProvider> {
    if (ext.api === undefined) {
        // Unit test, default to session token auth
        return new Promise((resolve) => resolve(new ociCommon.SessionAuthDetailProvider(undefined, profile)));
    }
    let authProvider = await ext.api.getOCIAuthProvider(profile);//.getOCIAuthProvider(profile);
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'AuthProvider', undefined));
    return authProvider;
}
