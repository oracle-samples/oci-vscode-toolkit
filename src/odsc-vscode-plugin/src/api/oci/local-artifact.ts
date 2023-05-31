/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as os from "os";
import * as pathModule from "path";
import { SandboxFolder } from "oci-ide-plugin-base/dist/common/fileSystem/sandbox-folder";
import * as filesystem from "oci-ide-plugin-base/dist/common/fileSystem/filesystem";
import * as dataScienceArtifacts from '../../api/oci/data-science-artifacts';

const DefaultLocationUnderUserHomeFolder = 'oci-ide-plugins/datascience-artifacts';

export function artifactsSandboxFolder(): SandboxFolder {
    return new SandboxFolder(`${os.homedir()}${pathModule.sep}${DefaultLocationUnderUserHomeFolder}`);
}

export async function compareLocalJobArtifactWithArtifactFromService(jobId: string): Promise<string> {
    const artifactStorage = artifactsSandboxFolder();
    if (artifactStorage.pathExists(jobId)) {
        const localArtifactPath = artifactStorage.fullPath(jobId);
        //Download job artifact from service in a temp directory to compare with local artifact folder
        const tempArtifactFolder = jobId + '_temp';
        const serviceArtifactPath: string = await dataScienceArtifacts.downloadJobArtifact(jobId, tempArtifactFolder);
        const result = filesystem.compareDirStructureAndFileContents(localArtifactPath, serviceArtifactPath);
        filesystem.ensureDoesNotExists(serviceArtifactPath);
        return result ? "Unmodified" : "Modified";
    }
    return "Unmodified";
}

export async function getJobIdFromArtifactPath(artifactPath: string): Promise<string> {
    const artifactStorage = artifactsSandboxFolder();
    const relativePath = artifactStorage.relativePathFromAbsolute(artifactPath);
    return relativePath.split(pathModule.sep)[0];
}
