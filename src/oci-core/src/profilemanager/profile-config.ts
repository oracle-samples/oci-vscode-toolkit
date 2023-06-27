/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

 import * as vscode from 'vscode';
 import * as path from 'path';
 import * as fs from 'fs';
 import * as ini from 'ini';
 import assert from '../util/assert';
 import {ConfigFileReader} from 'oci-common/lib/config-file-reader';
import { LOG } from '../logger';
import { OciExtensionError } from '../errorhandler';
import * as nls from 'vscode-nls';

 const localize: nls.LocalizeFunc = nls.loadMessageBundle();
 
 const logger = LOG.getLogInstance();
 
 // Check if config file defined in the settings exists or not
 export function configFileExists(): boolean {
     const filePath = getConfigFilePath();
     return fs.existsSync(filePath);
 }
 
 // Gets the default ~/.oci/config file path (from settings) or /etc/oci/config from cloudshell env
 export function getConfigFilePath(): string {
     const cloudShellConfig = getCloudShellConfigIfExists();
     let filename: string | undefined = vscode.workspace
         .getConfiguration()
         .get('oci.configFileLocation');
     assert(filename, 'filename');
 
     if(cloudShellConfig) {
         vscode.commands.executeCommand('setContext', 'cloudEditorEnv', true);
         filename = cloudShellConfig;
     }
     else {
        vscode.commands.executeCommand('setContext', 'cloudEditorEnv', false);
         filename = ConfigFileReader.expandUserHome(filename);
     }
     return filename;
 }

 //gets cloud shell config path from env var
 export function getCloudShellConfigIfExists(): string | undefined {
    const cloudEditorConfig = process.env.OCI_CONFIG_FILE;
    return cloudEditorConfig;
 }

  // Check if cloud shell config exists or not
 export function cloudShellConfigExists(): boolean {
    return getCloudShellConfigIfExists() !== undefined ? true : false;
 }
 
 // gets the config folder only (no filename)
 export function getConfigPath(): string {
     const fullPath = getConfigFilePath();
     return path.dirname(fullPath);
 }
 
 // gets the path to the /sessions folder used with session auth
 export function getSessionFolderPath(profileName: string) {
     assert(profileName, 'profileName');
     const configFolder = getConfigPath();
     return path.join(configFolder, 'sessions', profileName);
 }

// Returns all profile names from the configuration file
 export function getProfileNames(): string[] {
    const filePath = getConfigFilePath();
    if (!fs.existsSync(filePath)) {
        const missingConfigFileMsg = localize("missingConfigFileMsg", "configuration file is missing");
        logger.error(missingConfigFileMsg, filePath);
        return [];
    }

    try {
        const data = ini.parse(fs.readFileSync(filePath, 'utf-8'));
        return Array.from(Object.keys(data));
    } catch (err) {
        const invalidConfigFileLogMsg = localize("invalidConfigFileLogMsg", "configuration file is invalid");
        logger.error(invalidConfigFileLogMsg, filePath);
        const invalidConfigFileMsg = localize("invalidConfigFileMsg","Fetching profiles from config file failed: Invalid file");
        vscode.window.showErrorMessage(invalidConfigFileMsg);
        throw new OciExtensionError(err);
    }
}
 
 // returns the session folder path
 // recreates the folder if it already exists
 export function ensureSessionProfileFolder(profileName: string) {
     assert(profileName, 'profileName');
     const configFolder = getConfigPath();
     const sessionPath = path.join(configFolder, 'sessions', profileName);
 
     if (fs.existsSync(sessionPath)) {
        fs.rmSync(sessionPath, { recursive: true, force: true });
     }
     fs.mkdirSync(sessionPath, { recursive: true });
     return sessionPath;
 }
 
