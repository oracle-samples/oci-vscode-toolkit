/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as filesystem from './filesystem';
import * as stream     from "stream";

const AdmZip = require("adm-zip");

export async function zip(directoryPath: string, zippedFilePath: string , zipFolderName: string = "") {
    filesystem.ensureDoesNotExists(zippedFilePath);
    const zip = new AdmZip();
    zip.addLocalFolder(directoryPath,zipFolderName);
    await zip.writeZip(zippedFilePath, true);
}

export async function unzipFromBuffer(content: stream.Readable, outputPath: string) {
    async function makeBuffer() {
        const artifactChunks = [];
        for await (let chunk of content) {
            // @ts-ignore
            artifactChunks.push(chunk);
        }
        return Buffer.concat(artifactChunks);
    }

    const zip = new AdmZip(await makeBuffer());
    zip.extractAllTo(outputPath, true);
}
