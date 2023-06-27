/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
export interface IJwk {
    kid: string;
    kty?: string | undefined;
    n?: string | undefined;
    e?: string | undefined;
}

export interface IKeypair {
    publicKey: string;
    privateKey: string;
    jwk: IJwk;
    fingerprint: string;
}
