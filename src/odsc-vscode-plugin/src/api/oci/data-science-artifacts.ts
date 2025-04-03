/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as fs from "fs";
import * as stream from 'stream';

import * as dataScienceRequests from "oci-datascience/lib/request";
import * as dataScienceResponses from "oci-datascience/lib/response";
import * as dataScience from "oci-datascience";

import { isScriptFile, isZipFile } from "oci-ide-plugin-base/dist/common/fileSystem/file-types";
import * as filesystem from "oci-ide-plugin-base/dist/common/fileSystem/filesystem";
import { unzipFromBuffer, zip } from "oci-ide-plugin-base/dist/common/fileSystem/zip";
import * as localArtifact from "./local-artifact";
import * as pathModule from "path";

import { getJob } from "./data-science";
import { makeDataScienceClient } from "./clients";


export async function downloadJobArtifact(jobId: string, artifactDir: string = jobId): Promise<string> {
    const client = await makeDataScienceClient();
    const jobArtifactContentResponse = await client.getJobArtifactContent({
        jobId: jobId,
    });

    return materializeArtifactFolderFromResponse();

    async function materializeArtifactFolderFromResponse() {
        const jobArtifactStream = jobArtifactContentResponse.value as stream.Readable;
        const fileName = jobArtifactContentResponse && jobArtifactContentResponse.contentDisposition.split('filename=')[1].split(';')[0];

        const artifactStorage = localArtifact.artifactsSandboxFolder();
        const artifactDirectoryPath = artifactStorage.ensureDirectoryExists(artifactDir);
        await materializeArtifactContent(jobArtifactStream, artifactDirectoryPath, artifactDir, fileName);

        return artifactStorage.fullPath(artifactDir);
    }

    async function materializeArtifactContent(jobArtifactStream: stream.Readable, artifactDirectoryPath: string, artifactDir: string, fileName: string) {
        if (isZipFile(fileName)) {
            await unzipFromBuffer(jobArtifactStream, artifactDirectoryPath);
            filesystem.ensureDoesNotExists(`${artifactDir}/__MACOSX`);
        } else {
            await filesystem.createFileFromStream(`${artifactDirectoryPath}/${fileName}`, jobArtifactStream);
        }
    }
}

export async function createNewJobFromArtifact(artifactPath: string): Promise<string> {
    const client = await makeDataScienceClient();
    const existingJobId = await localArtifact.getJobIdFromArtifactPath(artifactPath);
    const artifactStorage = localArtifact.artifactsSandboxFolder();
    const artifactPathOfExistingJob = artifactStorage.fullPath(existingJobId);
    
    const createJobResponse: dataScienceResponses.CreateJobResponse = await client.createJob({
        createJobDetails: jobDetailsFromExistingJob(await getJob(existingJobId))
    });

    const jobArtifactRequest = await buildCreateJobArtifactRequest(createJobResponse.job.id);
    await client.createJobArtifact(jobArtifactRequest);
    filesystem.ensureDoesNotExists(`${artifactPathOfExistingJob}${pathModule.sep}artifact.zip`);

    return createJobResponse.job.id;

    function jobDetailsFromExistingJob(existingJob: dataScience.models.Job): dataScience.models.CreateJobDetails {
        return {
            projectId: existingJob?.projectId,
            compartmentId: existingJob?.compartmentId,
            jobConfigurationDetails: existingJob?.jobConfigurationDetails,
            jobInfrastructureConfigurationDetails: existingJob?.jobInfrastructureConfigurationDetails,
            jobLogConfigurationDetails: existingJob?.jobLogConfigurationDetails,
            freeformTags: existingJob?.freeformTags,
            definedTags: existingJob?.definedTags,
        };
    }

    async function buildCreateJobArtifactRequest(newJobId: string): Promise<dataScienceRequests.CreateJobArtifactRequest> {
        let artifactName, newJobArtifact;
        if (isScriptFile(artifactPath)) {
            artifactName = pathModule.basename(artifactPath);
            newJobArtifact = fs.createReadStream(artifactPath, 'utf-8');
        } else {
            artifactName = 'artifact.zip';
            const tempZipFolderPath = `${artifactPathOfExistingJob}${pathModule.sep}${artifactName}`;
            await zip(artifactPath, tempZipFolderPath, getZipFolderName() );
            newJobArtifact = fs.createReadStream(tempZipFolderPath, undefined);
        }

        return {
            jobId: newJobId,
            jobArtifact: newJobArtifact,
            contentDisposition: "attachment; filename=" + artifactName,
        };
    }

    /*
     * Returns the name of the intermediate folder where the contents will be copied and zipped
     * If the path is 
     *   -the path of the root of the job artifact folder, returns an empty string as intermediate folder creation is not needed
     *   -the path of sub-folder in job-artifact folder, returns the sub-folder name
     */
    function getZipFolderName() {
        return artifactPath !== artifactPathOfExistingJob? pathModule.basename(artifactPath): "";
    }
    
}
