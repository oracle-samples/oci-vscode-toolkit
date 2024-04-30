/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import path = require("path");
import { ext } from "../../extensionVars";
import { SandboxFolder } from "../../oci-api";

export const TERRAFORM_CONFIG_PLUGIN_ROOT_FOLDER = 'rms-terraform-configs';

export function getDefaultArtifactFolderPath(){
    return ext.api.getDefaultArtifactFolderPath(TERRAFORM_CONFIG_PLUGIN_ROOT_FOLDER);
}

export function getResourceManagerArtifactHook() : SandboxFolder {   
    return ext.api.getArtifactsSandboxFolder(TERRAFORM_CONFIG_PLUGIN_ROOT_FOLDER);
}

export function getResourceManagerFolder(stackId: string): string{
    return path.join(getDefaultArtifactFolderPath(), stackId);
}
