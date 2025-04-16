/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import path = require("path");
import { SandboxFolder } from "oci-ide-plugin-base/dist/common/fileSystem/sandbox-folder";
import { getArtifactsSandboxFolder, getDefaultArtifactFolderPath } from "oci-ide-plugin-base/dist/common/fileSystem/local-artifact";

export const ARTIFACT_DEPLOY_FUNC_FOLDER = 'deploy_func';

export function getFAASRootFolder() {
    return getDefaultArtifactFolderPath(getDefaultArtifactFolderName());
}

function getDefaultArtifactFolderName(): string {
    return 'faas-artifacts';
}

export function getArtifactHook(): SandboxFolder {
    return getArtifactsSandboxFolder(getDefaultArtifactFolderName());
}

export function getFunctionsFolder(applicationID: string, functionName: string): string {
    return path.join(getFAASRootFolder(), applicationID, functionName);
}
