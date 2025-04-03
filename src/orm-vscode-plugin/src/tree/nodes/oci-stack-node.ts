/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { OCINode } from "./ociNode";
import { window,ProgressLocation, TreeItemCollapsibleState } from 'vscode';
import { getResourcePath } from "../../utils/path-utils";
import { OCIStackNodeItem } from "../../commands/resources";
import { getStack } from "../../api/orm-client";
import { getTFfileNodesByConfigType, populateFileNodes } from "../../stack-manager/download-stack";
import { IOCIResource, OCIFileExplorerNode } from "../../oci-api";
import { getResourceManagerArtifactHook } from "../../common/fileSystem/local-terraform-config";
import path = require("path");
import * as nls from "vscode-nls";

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export class OCIStackNode extends OCINode {
    constructor(stack: IOCIResource) {
        super(
            stack,
            TreeItemCollapsibleState.Collapsed,
            getResourcePath(path.join('light', 'each-stack-light.svg')), 
            getResourcePath(path.join('dark','each-stack-dark.svg')),
            OCIStackNodeItem.commandName,
            [],
            OCIStackNodeItem.context,
            [],
        );
    }

    getChildren(_element: any): Thenable<OCIFileExplorerNode[]> {
        
        return getStack(this.resource.id!)
        .then((result) => { 
            const configSource = result.stack.configSource?.configSourceType;
            return window.withProgress<OCIFileExplorerNode[]>(
                {
                    location: ProgressLocation.Notification,
                    cancellable: false,
                },
            async (progress) => {
                    if(getResourceManagerArtifactHook().pathExists(result.stack.id!)){
                        return await populateFileNodes(result);
                    }
                    else{
                        progress.report({ message: localize('downloadTFConfigMsg', 'Downloading the Terraform configuration…') });
                        return getTFfileNodesByConfigType(configSource, this.profile.getProfileName(), result);
                    }
                },
            );
        });
    }
}
