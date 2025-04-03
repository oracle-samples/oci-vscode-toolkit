/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

 import * as path from 'path';
 import { ext } from '../extensionVars';
 
 // Gets the path under the 'resources' folder
 // Used for icons and templates
 export function getResourcePath(name: string): string {
     return path.join(ext.context.asAbsolutePath('resources'), name);
 }
 
