/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

 export function isPayloadValid(payload: any) : boolean{
    let payloadIsValid = true;
    if (!payload.region_name || !payload.activation_type || !payload.compartment_ocid || !payload.resource_ocid) {
        payloadIsValid = false;
    }
    return payloadIsValid;
}
