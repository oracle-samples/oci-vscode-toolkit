/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import {FileType} from 'vscode';
import {BaseNode} from '../userinterface/base-node';
import {IRootNode} from '../userinterface/root-node';
import {createFileExplorer} from '../util/fileExplorer';
import {getResourceIconPath,getResourcePath} from '../util/path-utils';
import {getIconForFile} from 'vscode-icons-js';


export const OCIFileExplorerNodeItem = {
    commandName: `oci-core.OpenFile`,
    lightIcon: '',
    darkIcon: '',
    label: '', // set dynamically
    context: 'OCIFileExplorerNode',
};

export class OCIFileExplorerNode extends BaseNode implements IRootNode {
    public readonly id: string;
    public readonly uriPath: vscode.Uri;
    public readonly type: vscode.FileType;
    public readonly canBeDeleted: boolean;
    public readonly isTopDirectory: boolean;
    public readonly isDirectory: boolean;

    constructor(id: string,
                uri: vscode.Uri,
                type: vscode.FileType,
                canBeDeleted: boolean = true,
                isTopDirectory: boolean = false,
                label: string | undefined = undefined,) {
        const iconFilePath = vscode.FileType.File && (getIconForFile(uri.fsPath.toLowerCase()) != undefined) ? getIconForFile(uri.fsPath.toLowerCase()) : undefined;

        function createContextString() {
            let context = OCIFileExplorerNodeItem.context;
            if (canBeDeleted) {
                context += '_canBeDeleted';
            }
            if (isTopDirectory) {
                context += '_isTopDirectory';
            }
            if (type == FileType.Directory) {
                context += '_isDirectory';
            }

            return context;
        }

        super(uri.fsPath.split('/').pop()!,
            label ? label : uri.fsPath.split('/').pop()!,
            type === vscode.FileType.File ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed,
            type === vscode.FileType.File && iconFilePath != undefined ? getResourceIconPath(iconFilePath) : undefined,
            type === vscode.FileType.File && iconFilePath != undefined ? getResourceIconPath(iconFilePath) : undefined,
            OCIFileExplorerNodeItem.commandName,
            [uri],
            createContextString(),
            [],
            undefined,
            undefined,
            uri.fsPath
        );
        this.id = id;
        this.uriPath = uri;
        this.type = type;

        this.canBeDeleted = canBeDeleted;
        this.isTopDirectory = isTopDirectory;
        this.isDirectory = this.type == FileType.Directory;
    }

    getChildren(element: any): Thenable<OCIFileExplorerNode[]> {
        const nodes: OCIFileExplorerNode[] = [];
        if (this.type === vscode.FileType.Directory) {
            let x = {uri: this.uriPath, type: vscode.FileType.Directory};
            return createFileExplorer(x);
        }
        return Promise.all(nodes);
    }
}
