/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
export interface IOCIBasicResource {
    /**
     * The resource type name.
     */
    resourceType: string;
    /**
     * The unique identifier for this particular resource, usually an OCID.
     */
    identifier: string;
    /**
     * The OCID of the compartment that contains this resource.
     */
    compartmentId: string;
    /**
     * The time this resource was created.
     */
    timeCreated?: Date;
    /**
     * The display name (or name) of this resource, if one exists.
     */
    displayName?: string;
    /**
     * The availability domain this resource is located in, if applicable.
     */
    availabilityDomain?: string;
    /**
     * The lifecycle state of this resource, if applicable.
     */
    lifecycleState?: string;
    /**
     * The freeform tags associated with this resource, if any.
     */
    freeformTags?: {
        [key: string]: string;
    };
    /**
     * The defined tags associated with this resource, if any.
     */
    definedTags?: {
        [key: string]: {
            [key: string]: any;
        };
    };
}
