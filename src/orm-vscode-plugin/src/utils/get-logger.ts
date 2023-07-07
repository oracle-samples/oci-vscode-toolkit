/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { ext } from "../extensionVars";
import { LOG } from "../oci-api";

export function logger(): LOG {
    return ext.api.getLogger("oci-vscode-toolkit");
}
