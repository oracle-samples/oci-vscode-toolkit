/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
export interface IOCIResource {
    id?: string;
    identifier?: string;
    displayName?: string;
    name?: string;
    compartmentId?: string;
    compartmentName?: string;
    definedTags?: {
        [key: string]: {
            [key: string]: any;
        };
    };
    freeformTags?: { [key: string]: string };
    timeCreated?: Date;
    timeUpdated?: Date;
    lifecycleState?: string;
}
