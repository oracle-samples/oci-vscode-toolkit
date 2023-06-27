/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 import * as fs from 'fs';
 import * as pathModule from 'path';
 import { once }        from "events";
 import * as stream     from 'stream';
 import * as util       from 'util';
 import * as dirCompare from 'dir-compare';
 import * as nls        from 'vscode-nls';

 const localize: nls.LocalizeFunc = nls.loadMessageBundle();

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
 
 export function requireRelativePath(path: string) {
     if (pathModule.isAbsolute(path)) {
         const errorMsg = localize("relativePathErrorMsg","Expected a relative path.");
         throw Error(errorMsg);
     }
 }
 
 export function requireAbsolutePath(path: string) {
     if (!pathModule.isAbsolute(path)) {
         const errorMsg = localize("absolutePathErrorMsg","Expected an absolute path.");
         throw Error(errorMsg);
     }
 }
 
 const finished = util.promisify(stream.finished);
 export async function createFileFromStream(path: string, jobArtifact: stream.Readable) {
     const writeStream = fs.createWriteStream(path, 'utf-8');
     for await (let chunk of jobArtifact) {
         if (!writeStream.write(chunk)) {
             await once(writeStream, 'drain');
         }
     }
     writeStream.end();
     await finished(writeStream);
 }
 
 export function compareDirStructureAndFileContents(path1: string, path2: string) {
     const result = dirCompare.compareSync(path1, path2, { compareContent: true, excludeFilter: ".DS_Store" });
     return result.same;
 }
 
 export function loadTemplatedStringFromTextFile(filePath: string, templateReplacements: {} = {}) {
     const content = fs.readFileSync(filePath).toString();
     return fillTemplate(content, templateReplacements);
 }
 
 export function getFileTypeStats(filePath: string) {
    return fs.statSync(filePath);
 }

 function fillTemplate(text: string, data: {[index: string]: string}) : string {
     return text.replace(/\${ *([\w_]+) *}/g, function (match, key) {
         return data[key];
     });
 }
