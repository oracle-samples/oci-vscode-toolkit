/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { IOCIResource } from "./resource";

// The reason for having a separate OCICompartment interface
// is because the original interface defines 'name', while other
// resources define 'displayName' ...
export interface IOCICompartment extends IOCIResource {
    name: string;
    description: string;
}
