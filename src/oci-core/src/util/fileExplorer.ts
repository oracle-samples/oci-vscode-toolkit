/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {OCIFileExplorerNode} from '../tree/oci-file-explorer-node';

export interface IFileExplorer {
    GetChildNodes(path: FileExplorerItem): Promise<OCIFileExplorerNode[]>;
}

export function createFileExplorer(element: FileExplorerItem) {
    return new FileExplorer().GetChildNodes(element);
}

export function createDirectoryNode(directoryPath: string, canBeDeleted: boolean, isTopDirectory: boolean, label: string | undefined): OCIFileExplorerNode {
    return new OCIFileExplorerNode(
        vscode.Uri.file(directoryPath).fsPath,
        vscode.Uri.file(directoryPath),
        vscode.FileType.Directory,
        canBeDeleted,
        isTopDirectory,
        label,
    );
}

class FileStat implements vscode.FileStat {

    constructor(private fsStat: fs.Stats) {
    }

    get type(): vscode.FileType {
        return this.fsStat.isFile() ? vscode.FileType.File : this.fsStat.isDirectory() ? vscode.FileType.Directory : this.fsStat.isSymbolicLink() ? vscode.FileType.SymbolicLink : vscode.FileType.Unknown;
    }

    get isFile(): boolean | undefined {
        return this.fsStat.isFile();
    }

    get isDirectory(): boolean | undefined {
        return this.fsStat.isDirectory();
    }

    get isSymbolicLink(): boolean | undefined {
        return this.fsStat.isSymbolicLink();
    }

    get size(): number {
        return this.fsStat.size;
    }

    get ctime(): number {
        return this.fsStat.ctime.getTime();
    }

    get mtime(): number {
        return this.fsStat.mtime.getTime();
    }
}

export interface FileExplorerItem {
    uri: vscode.Uri;
    type: vscode.FileType;
}

class FileExplorer implements IFileExplorer {
    private static readDirectory(uri: vscode.Uri): [string, vscode.FileType][] | Thenable<[string, vscode.FileType][]> {
        return FileExplorer._readDirectory(uri);
    }

    private static async _readDirectory(uri: vscode.Uri): Promise<[string, vscode.FileType][]> {
        const filesWithoutHiddenAndZipFiles = fs.readdirSync(uri.fsPath)
            .filter(file => !(/(^|\/)\.[^\/.]/g).test(file)).filter(file => !file.endsWith('.zip')).filter(file => !file.endsWith('.gz')).filter(file => !file.endsWith('__MACOSX'));
        const result: [string, vscode.FileType][] = [];
        for (let i = 0; i < filesWithoutHiddenAndZipFiles.length; i++) {
            const child = filesWithoutHiddenAndZipFiles[i];
            const stat = await FileExplorer._stat(path.join(uri.fsPath, child));
            result.push([child, stat.type]);
        }
        return Promise.resolve(result);
    }

    private static async _stat(path: string): Promise<vscode.FileStat> {
        return new FileStat(fs.statSync(path));
    }

    //Get the immediate children files/folders as `OCIFileExplorerNode`, which in turn
    async GetChildNodes(element?: FileExplorerItem): Promise<OCIFileExplorerNode[]> {
        if (element) {
            // If path is a file, just create a new node from that file
            if (element.type === vscode.FileType.File) {
                return [new OCIFileExplorerNode(
                    vscode.Uri.file(element.uri.fsPath).fsPath,
                    vscode.Uri.file(element.uri.fsPath),
                    vscode.FileType.File
                )];
            }
            const children = await FileExplorer.readDirectory(element.uri);
            return children.map(([name, type]) => (new OCIFileExplorerNode(
                vscode.Uri.file(path.join(element.uri.fsPath, name)).fsPath,
                vscode.Uri.file(path.join(element.uri.fsPath, name)),
                type
            )));
        }
        return [];
    }

}
