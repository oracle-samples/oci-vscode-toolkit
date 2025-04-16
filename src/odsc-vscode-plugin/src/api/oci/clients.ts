/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as ociCommon                    from "oci-common";
import { ext }                           from "../../extensionVars";
import * as dataScience                  from "oci-datascience";
import * as ociLoggingSearch             from "oci-loggingsearch";
import * as clients                      from "./clients";
import { AuthenticationDetailsProvider } from "oci-common";
import { DataScienceClient }             from "oci-datascience";
import { LogSearchClient }               from "oci-loggingsearch";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import { METRIC_FAILURE, METRIC_INVOCATION, METRIC_SUCCESS } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { MONITOR } from "../../common/monitor";

const maxDelayTimeInSeconds = 10;
const maxTerminationTimeInSeconds = 3;
const clientConfiguration = {
    retryConfiguration: {
        terminationStrategy: new ociCommon.MaxAttemptsTerminationStrategy(maxTerminationTimeInSeconds),
        delayStrategy: new ociCommon.ExponentialBackoffDelayStrategy(maxDelayTimeInSeconds),
        retryCondition: (error: { statusCode: number; }) => {
            return error.statusCode === (409 || 429 || 500 || 502 || 503 || 504);
        }
    }
};

let profileName = 'DEFAULT';

export function setProfileName(newProfileName: string) {
    profileName = newProfileName;
}

async function getAuthProvider(): Promise<AuthenticationDetailsProvider> {
    try {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'getAuthProvider', undefined));            
        let provider = await ext.api.getOCIAuthProvider(profileName);
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'getAuthProvider', undefined));            
        return provider;
    } catch (e) {
        MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'getAuthProvider', undefined, undefined, JSON.stringify(e)));            
        return makeAuthProviderFromDefaultConfig();
    }
}

function makeAuthProviderFromDefaultConfig(): AuthenticationDetailsProvider {
    return new ociCommon.ConfigFileAuthenticationDetailsProvider(undefined, profileName);
}

interface ClientConstructor {
    new(params: ociCommon.AuthParams, clientConfiguration?: ociCommon.ClientConfiguration) : any;
}

export async function makeClient<type>(clientType: ClientConstructor): Promise<type> {
    return new clientType({authenticationDetailsProvider: await getAuthProvider(),}, clientConfiguration);
}

export async function makeDataScienceClient(): Promise<DataScienceClient> {
    return clients.makeClient<dataScience.DataScienceClient>(dataScience.DataScienceClient);
}

export async function makeLoggingSearchClient(): Promise<LogSearchClient> {
    return clients.makeClient<ociLoggingSearch.LogSearchClient>(ociLoggingSearch.LogSearchClient);
}
