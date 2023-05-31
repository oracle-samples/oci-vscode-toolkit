/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 export interface IOCIProfile {
    getProfileName(): string;
    getRegionName(): string;
    setRegionName(regionName: string): void;
    usesSessionAuth(): boolean;
    getTenancy(): string;
    getUser(): string;
}

export interface IProfileConfig {
    profileName: string;
    fingerprint?: string;
    region: string;
    tenancy: string;
    keyFile: string;
    user: string;
    securityTokenFilePath?: string;
}
