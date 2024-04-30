/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as pathModule from "path";
import * as filesystem from "./filesystem";
import * as fs         from "fs";
import * as nls        from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export class SandboxFolder {
    public readonly root: string; 
    
    constructor(storageRoot: string) {
        this.root = pathModule.resolve(storageRoot);
        filesystem.ensureDirectoryExists(this.root);
    }

    remove(fileOrFolderPath: string) {
        // Handles both relative and absolute path.
        if (pathModule.isAbsolute(fileOrFolderPath)) {
            filesystem.ensureDoesNotExists(this.fullPath(this.relativePathFromAbsolute(fileOrFolderPath)));
        }else{
            filesystem.ensureDoesNotExists(this.fullPath(fileOrFolderPath));
        }
    }

    ensureDirectoryExists(relativePath: string): string {
        filesystem.requireRelativePath(relativePath);
        const path = this.fullPath(relativePath);
        filesystem.ensureDirectoryExists(path);
        return path;
    }

    fullPath(relativePath: string): string {
        filesystem.requireRelativePath(relativePath);
        return `${this.root}${pathModule.sep}${relativePath}`;
    }

    pathExists(relativePath: string): boolean {
        filesystem.requireRelativePath(relativePath);
        return fs.existsSync(this.fullPath(relativePath));
    }

    createTextFile(relativePath: string, content: string): string {
        filesystem.requireRelativePath(relativePath);
        const fullPath = this.fullPath(relativePath);
        fs.writeFileSync(fullPath, content);
        return fullPath;
    }

    listNonHiddenItems(relativePath: string = ''): string[] {
        const fullPath = this.fullPath(relativePath);
        let fileNames: string[] = [];
        const filesWithoutHiddenOnes = fs.readdirSync(fullPath).filter(item => !(/(^|\/)\.[^\/.]/g).test(item));
        filesWithoutHiddenOnes.map(filesWithoutHiddenOnes => fileNames.push(filesWithoutHiddenOnes));
        return fileNames;
    }

    relativePathFromAbsolute(absolutePath: string) {
        filesystem.requireAbsolutePath(absolutePath);
        if (!absolutePath.startsWith(this.root)) {
            const errorMsg = localize("absolutePathErrorMsg","Expected an absolute path starting with the storage root ({0}).",this.root);
            throw Error(errorMsg);
        } 
        return absolutePath.replace(this.root + pathModule.sep, '');
    }
}
