/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { OCINode } from "./ociNode";
import * as vscode from 'vscode';
import { getResourcePath } from "../../../utils/path-utils";
import { OCIFunctionNodeItem } from "../../commands/resources";
import { ext } from "../../../extensionVars";
import { FileExplorerItem, OCIFileExplorerNode } from "../../../oci-api";
import { IOCIFunction } from "../../../api/types";
import { OCIApplicationNode } from "./oci-application-node";
import { Repository } from "../../../git";
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();
export class OCINewFunctionNode extends OCINode {
    public profileName: string;
    repository: Repository | null | undefined;
    public uriRepo: vscode.Uri;
    public readonly func: IOCIFunction;
    parent: OCIApplicationNode | undefined;
    isGitRepo: boolean = false;
    constructor(
        func: IOCIFunction,
        profileName: string,
        tooltip: string | undefined,
        parent: OCIApplicationNode | undefined,
        uriRepo: vscode.Uri,
        repository?: Repository
    ) {
        super(
            func,
            vscode.TreeItemCollapsibleState.Expanded,
            getResourcePath('light/function-light.svg'),
            getResourcePath('dark/function-dark.svg'),
            OCIFunctionNodeItem.commandName,
            [],
            OCIFunctionNodeItem.context,
            [],
            parent,
            undefined,
            tooltip,
        );
        this.profileName = profileName;
        this.uriRepo = uriRepo;
        this.func = func;
        this.repository = repository;
    }

    getChildren(_element: any): Thenable<OCIFileExplorerNode[]> {
        let pathToDir: FileExplorerItem = { uri: this.uriRepo, type: vscode.FileType.Directory };
        return ext.api.createFileExplorer(pathToDir);
    }
}

export const OCINewFunctionType = {
    FromCodeRepository: {
        createString: localize("createFuncFromCodeRepository", "Create from a code repository"),
        type: 'CODEREPO'
    },
    FromTemplate: {
        createString: localize("createFuncFromTemplate", "Create from a template"),
        type: 'TEMPLATE'
    },
    FromSample: {
        createString: localize("createFuncFromSample", "Create from a sample"),
        type: 'SAMPLE'
    },
};
