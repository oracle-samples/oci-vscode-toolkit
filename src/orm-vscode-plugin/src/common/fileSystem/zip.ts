/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import stream = require("stream");
import { promisify } from "util";
import * as pathModule from "path";
import * as fs from 'fs';
var AdmZip = require("adm-zip");

export async function writeZipStreamToFile(directoryPath: string, tfConfigStream: any) {
    const pipeline = promisify(stream.pipeline);
    try {
         var writable = fs.createWriteStream(directoryPath);
         await pipeline(tfConfigStream, writable);
    } catch (error) {
        throw error;
    }
}

export async function zip(directoryPath: string, fileName: string) {
    try {
        let outputZipFile = `${directoryPath}${pathModule.sep}${fileName}.zip`;
        const zip = new AdmZip();
        zip.addLocalFolder(directoryPath);
        await zip.writeZip(outputZipFile, true);
    } catch (error) {
        throw error;
    }
}

export async function unzip(extractToDirectory: string, zipFilePath: string) {
    try {
        const zip = new AdmZip(zipFilePath);
        await zip.extractAllTo(extractToDirectory, true);
    } catch (error) {
        throw error;
    }
}
