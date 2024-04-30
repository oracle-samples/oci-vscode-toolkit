/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as fs from 'fs';
import * as path from 'path';

export function ensureDirectoryExists(path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, {recursive: true});
    }
}

export function ensureDoesNotExists(path: string) {
    if (fs.existsSync(path)) {                  
        fs.rmSync(path, { recursive: true, force: true });
    }
}

export async function getTfConfigFiles(directory: string): Promise<string[]> {
    let tfConfigFiles: string[] = []; 
    try {
        const files = await fs.promises.readdir(directory);
        for (const file of files) {
          const p = path.join(directory, file);
          if ((await fs.promises.stat(p)).isDirectory()) {
            tfConfigFiles = [...tfConfigFiles, ...(await getTfConfigFiles(p))];
          } else {
            tfConfigFiles.push(p);
          }
        }
        tfConfigFiles = tfConfigFiles.filter(ext => path.extname(ext) === '.tf');
        return tfConfigFiles;
    } catch (error) {
        throw error;
    }
}

export async function readFileAndEncodeContentBase64(path: string) : Promise<string> {
    try {
        return fs.readFileSync(path, {encoding: 'base64'});
    } catch (error) {
        throw error;
    }
}

export function readAsStreamFromFile(file: string) : fs.ReadStream {
    try {
        return fs.createReadStream(file, {encoding: 'utf8'});
    } catch (error) {
        throw error;
    }
}
