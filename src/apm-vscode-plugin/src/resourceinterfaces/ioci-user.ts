/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { IOCIResource } from "../oci-api";

export interface IOCIUser extends IOCIResource {
    "name": string;
    "description": string;
    "email"?: string;
    "emailVerified"?: boolean;
    "identityProviderId"?: string;
    "externalIdentifier"?: string;
    "capabilities"?: any;
    "isMfaActivated": boolean;
    "lastSuccessfulLoginTime"?: Date;
    "previousSuccessfulLoginTime"?: Date;
}
