/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

// Configuration root node and single config item node
import * as vscode from 'vscode';
import { OCIConfigurationNodeItem } from "../../commands/resources";
import { OCINode } from '../nodes/ociNode';
import { RootNode } from '../nodes/rootNode';
import { IOCIConfigurableResource, IOCIFunction } from "../../../api/types";
import { getResourcePath } from '../../../utils/path-utils';
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

const maskedValue = '******';

// Represents a single configuration value
class OCIConfigurationNode extends RootNode {
    public readonly id: string;
    public readonly value: string;
    public readonly name: string;
    public readonly profileName: string;
    private isValueVisible = false;
    constructor(
        profileName: string,
        id: string,
        name: string,
        value: string,
        parent: RootNode,
    ) {
        super(
            id,
            `${name}=${maskedValue}`,
            vscode.TreeItemCollapsibleState.None,
            OCIConfigurationNodeItem.lightIcon,
            OCIConfigurationNodeItem.darkIcon,
            OCIConfigurationNodeItem.commandName,
            [],
            OCIConfigurationNodeItem.context,
            [],
            parent,
        );
        this.value = value;
        this.name = name;
        this.id = id;
        this.profileName = profileName;
    }

    // Shows/hides the configuration value
    public toggleVisibility() {
        this.updateLabel(
            this.isValueVisible
                ? `${this.name}=${maskedValue}`
                : `${this.name}=${this.value}`,
        );
        this.isValueVisible = !this.isValueVisible;
    }
}

class OCIConfigurationRootNode extends RootNode {
    public readonly configurableResource: IOCIConfigurableResource;
    public readonly profileName: string;
    public readonly func: IOCIFunction | undefined = undefined;

    constructor(
        profileName: string,
        configurableResource: IOCIConfigurableResource,
        parent: OCINode,
        commandName: string,
        context: string
    ) {
        super(
            `Configuration-${configurableResource.id!}}`,
            localize("staticConfigurationNodeLabel", "Configuration"),
            vscode.TreeItemCollapsibleState.Collapsed,
            getResourcePath('light/gear-light.svg'),
            getResourcePath('dark/gear-dark.svg'),
            commandName,
            [configurableResource],
            context,
            [],
            parent
        );
        this.configurableResource = configurableResource;
        this.profileName = profileName;
    }

    getChildren(_element: any): Thenable<RootNode[]> {
        // Add implementation once mocks are finalised
        const configItems: RootNode[] = [];
        return Promise.all(configItems);

    }
}

export { OCIConfigurationRootNode, OCIConfigurationNode };
