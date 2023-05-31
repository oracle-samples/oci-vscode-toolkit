/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { LOG }   from "../oci-api";
import { ext }   from "../extensionVars";
import * as path from 'path';

export function logger(): LOG {
    return ext.api.getLogger("oci-vscode-toolkit");
}

// Gets the path under the 'resources' folder
// Used for icons and templates
export function getResourcePath(name: string): string {
    return path.join(ext.context.asAbsolutePath('resources'), name);
}
