/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as fs from 'fs';
import { getLogger } from '../logger/logging';
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

const logger = getLogger("oci-vscode-toolkit");

export function deleteFile(fsPath: string) {
    try {
        fs.unlinkSync(fsPath!);
    } catch (error) {
        const errorMsg = localize("deleteFileErrorMsg", "Error occured when deleting the file ");
        logger.error(errorMsg,fsPath);
        throw error;
    }
}

export function deleteFiles(filepaths: string[]) {
    filepaths!.forEach(filePath => deleteFile(filePath));
}

export function deleteDirectory(fsPath: string) {
    try {
        if (fs.existsSync(fsPath)) {
             fs.rmdirSync(fsPath, { recursive: true });
         }
         else
         {
         const infoMsg = localize("deleteDirInfoMsg", "Directory not found: ");
         logger.info(infoMsg,fsPath);
         }
    } catch (error) {
        const errorMsg = localize("deleteDirErrorMsg", " Error occurred while deleting the folder: ");
        logger.error(errorMsg + error, fsPath);
        throw error;
    }
}

export function createFile(fsPath: string) {
    try {
         fs.writeFileSync(fsPath,"");
    } catch (error) {
        const errorMsg = localize("createFileErrorMsg", "Error occured while creating the file: ");
        logger.error(errorMsg + error, fsPath);
        throw error;
    }
}
export function createDirectory(fsPath: string) {
    try {
         fs.mkdirSync(fsPath);
    } catch (error) {
        const errorMsg = localize("createDirErrorMsg", "Error occured while creating the folder ");
        logger.error(errorMsg+ error,fsPath);
        throw error;
    }
}
