/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

export interface IOCIWorkerInfo {
    ocid: string,
    vpInternalName: string
}
export interface IOCIWorkerCreateInfo {
    displayName: string;
    opVantagePoints: IOCIWorkerInfo[];
    domainPrivateDateKey: string;
    synApiServerUrl: string;
    installationDir: string;
    capability: string;
    workerTarFilePath: string;
    authType: string;
    osContent: string,
    containerType: string
}
