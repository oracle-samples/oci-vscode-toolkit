/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import ociCommon = require("oci-common");
import { METRIC_INVOCATION, METRIC_SUCCESS, METRIC_FAILURE } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import { TerraformAdvancedOptions } from "oci-resourcemanager/lib/model/terraform-advanced-options";
import { MONITOR } from "../common/monitor";
import { ext } from "../extensionVars";

const maxDelayTimeInSeconds = 10;
const maxTerminationTimeInSeconds = 3;

export const clientConfiguration = {
    retryConfiguration: {
        terminationStrategy: new ociCommon.MaxAttemptsTerminationStrategy(maxTerminationTimeInSeconds),
        delayStrategy: new ociCommon.ExponentialBackoffDelayStrategy(maxDelayTimeInSeconds),
        retryCondition: (error: { statusCode: number; }) => { return error.statusCode === (409 || 429 || 500 || 502 || 503 || 504); }
    }
};

export const terraformAdvancedOptions =  {
    isRefreshRequired: false,
    parallelism: 50,
    detailedLogLevel: TerraformAdvancedOptions.DetailedLogLevel.Info
};

export const pollingOptions = {
    pollInterval: 100,
    maxPollAttempts: 100000
};

export async function getAuthProvider(profile: string): Promise<ociCommon.AuthenticationDetailsProvider> {
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'getAuthProvider', undefined));    
        let provider = await ext.api.getOCIAuthProvider(profile);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'getAuthProvider', undefined));    
        return provider;
    } catch (e) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'getAuthProvider', undefined, undefined, JSON.stringify(e)));    
        return makeAuthProviderFromDefaultConfig(profile);
    }
}

function makeAuthProviderFromDefaultConfig(profileName: string): ociCommon.AuthenticationDetailsProvider {
    return new ociCommon.ConfigFileAuthenticationDetailsProvider(undefined, profileName);
}
