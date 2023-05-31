/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as path from 'path';
import { ext } from '../extension-vars';
import { getLogger } from '../logger/logging';
const logger = getLogger("oci-vscode-toolkit");

// Gets the path under the 'resources' folder
// Used for icons and templates
export function getResourcePath(name: string): string {
    return path.join(ext.context.asAbsolutePath('resources'), name);
}

// Gets the path under the 'resources' folder
// Used for icons 
export function getResourceIconPath(name: string): string {
    if(ext.context.asAbsolutePath("").includes(".vscode"))
    {
    return path.join(ext.context.asAbsolutePath('resources/icons'), name);
    }
    else
    {return path.join('resources','icons',name);}
}
