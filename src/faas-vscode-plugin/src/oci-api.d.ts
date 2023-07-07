/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Event, TreeItemCollapsibleState, TreeItem, CancellationToken, Webview, Uri, FileType } from 'vscode';
import { AuthenticationDetailsProvider } from 'oci-common';
import { GetCompartmentResponse } from 'oci-identity/lib/response/get-compartment-response';
import { BaseNode } from '../src/ui/tree/nodes/base-node';

export type NodeCreatorFunc = () => Promise<IRootNode[]>;

export interface IOCIApi {
    readonly getOCIAuthProvider: (
        profileName: string,
    ) => Promise<AuthenticationDetailsProvider>;
    readonly getProfiles: () => IOCIProfile[];
    readonly getProfile: (profileName: string) => IOCIProfile;
    getCurrentProfile: () => IOCIProfile;
    readonly signIn: (
        profileName?: string,
        regionName?: string,
        cancellationToken?: CancellationToken,
    ) => Promise<string | undefined>;

    // Returns true if OCI account (profile in config file) exists,
    // false otherwise.
    readonly accountExists: () => boolean;

    // Creates the tree provider with current profile root node and children nodes
    // If provided, additional root nodes are created as well
    readonly createProfileTreeProvider: (
        rootNodeCreatorFunc?: NodeCreatorFunc,
        profileChildrenCreatorFunc?: NodeCreatorFunc,
    ) => IOCIProfileTreeDataProvider;

    // Fires when profile selection has changed, either through configuration
    // or the UI
    onProfileChanged: Event<IOCIProfile>;

    // Fires after sign in has completed
    onSignInCompleted: Event<string>;

    // Fires when user clicks on the resource node in the tree view
    onResourceNodeClicked: Event<IRootNode>;

    // Fires when account is created (user signs in for the first time)
    onAccountCreated: Event<void>;

    // Gets the URL to the UI console
    getConsoleUrl: (regionName: string) => Promise<string>;

    // Gets all comparments from the current profile
    getAllCompartments: () => Promise<IOCICompartment[]>;

    // Gets all regions
    getRegions: () => IRegion[];

    //Gets logger channel
    getLogger: (channelName: string) => LOG;

    getWebView: (extensionUri: Uri, viewType: string, title: string) => CreateWebView;

    getCompartmentById: (compartmentId: string) => Promise<GetCompartmentResponse>;

    createFileExplorer: (path: FileExplorerItem) => Promise<OCIFileExplorerNode[]>;
}



export interface IRegion {
    name: string;
    shortName: string;
    realm: string;
    realmName: string;
}

export interface IOCIProfile {
    getProfileName(): string;
    getRegionName(): string;
    usesSessionAuth(): boolean;
    getTenancy(): string;
    getUser(): string;
}

export interface IOCIProfileTreeDataProvider {
    switchProfile(profile: IOCIProfile): Promise<void>;
    refresh(treeItem: IRootNode | undefined): void;

    getTreeItem(element: IRootNode): TreeItem;
    getChildren(element?: IRootNode): Thenable<IRootNode[]>;
    findTreeItem(nodeId: string): Promise<IRootNode | undefined>;
}

export interface IOCIProfileNode extends IRootNode {
    profileName: string;
    regionName: string;
}

export interface IRootNode {
    updateLabel(newLabel: string): void;
    updateDescription(newDescription: string): void;
    updateParentNode(n: IRootNode): void;
    getParentNode(): IRootNode | undefined;
    getChildren(element: any): Thenable<IRootNode[]>;

    id: string;
    label: string;
    commandName: string;
    commandArgs: any[];
    collapsibleState: TreeItemCollapsibleState;
    lightIcon: string;
    darkIcon: string;
    context: string;
    childrenNodes: IRootNode[];
    parent: IRootNode | undefined;
    description: string | undefined;
    tooltip: string | undefined;
}

export declare abstract class RootNode implements IRootNode {
    public id: string;
    public label: string;
    public readonly collapsibleState: TreeItemCollapsibleState;
    public readonly lightIcon: string;
    public readonly darkIcon: string;
    public readonly commandName: string;
    public readonly commandArgs: any[];
    public readonly context: string;
    public readonly childrenNodes: IRootNode[];
    public readonly parent: IRootNode | undefined;
    public description: string | undefined;
    public readonly tooltip: string | undefined;

    constructor(
        id: string,
        label: string,
        collapsibleState: TreeItemCollapsibleState,
        lightIcon: string,
        darkIcon: string,
        commandName: string,
        commandArgs: any[],
        context: string,
        childrenNodes: RootNode[],
        parent: RootNode | undefined,
        description: string | undefined,
        tooltip: string | undefined,
    );

    updateLabel(newLabel: string): void;
    updateDescription(newDescription: string): void;
    getParentNode(): IRootNode | undefined;
    getChildren(element: any): Thenable<IRootNode[]>;
    updateParentNode(n: IRootNode): void;
}

export interface IOCIResource {
    id?: string;
    displayName?: string;
    compartmentId?: string;
    definedTags?: {
        [key: string]: {
            [key: string]: any;
        };
    };
    freeformTags?: { [key: string]: string };
    timeCreated?: Date;
    timeUpdated?: Date;
    lifecycleState?: string;
}

export interface IOCIBasicResource {
    /**
     * The resource type name.
     */
    resourceType: string;
    /**
     * The unique identifier for this particular resource, usually an OCID.
     */
    identifier: string;
    /**
     * The OCID of the compartment that contains this resource.
     */
    compartmentId: string;
    /**
     * The time this resource was created.
     */
    timeCreated?: Date;
    /**
     * The display name (or name) of this resource, if one exists.
     */
    displayName?: string;
    /**
     * The availability domain this resource is located in, if applicable.
     */
    availabilityDomain?: string;
    /**
     * The lifecycle state of this resource, if applicable.
     */
    lifecycleState?: string;
    /**
     * The freeform tags associated with this resource, if any.
     */
    freeformTags?: {
        [key: string]: string;
    };
    /**
     * The defined tags associated with this resource, if any.
     */
    definedTags?: {
        [key: string]: {
            [key: string]: any;
        };
    };
}

// The reason for having a separate OCICompartment interface
// is because the original interface defines 'name', while other
// resources define 'displayName' ...
export interface IOCICompartment extends IOCIResource {
    name: string;
    description: string;
}

export class LOG implements ILogger {
    debug(message: string, ...optionalParams: any[]): void;
    info(message: string, ...optionalParams: any[]): void;
    warn(message: string, ...optionalParams: any[]): void;
    error(message: string, ...optionalParams: any[]): void;
    trace(message: string, ...optionalParams: any[]): void;
}
export interface ILogger {
    debug(message: string, ...optionalParams: any[]): void;
    info(message: string, ...optionalParams: any[]): void;
    warn(message: string, ...optionalParams: any[]): void;
    error(message: string, ...optionalParams: any[]): void;
    trace(message: string, ...optionalParams: any[]): void;
}

export interface IWebView {
    loadView(htmlBody: string, javaScriptsToLoad: string[], cssToLoad: string[]): void;
    killView(): void;
    getWebViewPanel(): Webview;
}

export class CreateWebView implements IWebView {
    loadView(htmlBody: string, javaScriptsToLoad: string[], cssToLoad: string[]): void;
    killView(): void;
    getWebViewPanel(): Webview;

}

export class OCIFileExplorerNode extends BaseNode implements IRootNode {
    updateLabel(newLabel: string): void;
    updateDescription(newDescription: string): void;
    updateParentNode(n: IRootNode): void;
    getParentNode(): IRootNode | undefined;
    getChildren(element: any): Thenable<IRootNode[]>;
    label: string;
    commandName: string;
    commandArgs: any[];
    collapsibleState: TreeItemCollapsibleState;
    lightIcon: string;
    darkIcon: string;
    context: string;
    childrenNodes: IRootNode[];
    parent: IRootNode | undefined;
    description: string | undefined;
    tooltip: string | undefined;
    public readonly id: string;
    public readonly uriPath: Uri;
    public readonly type: FileType;
}

export interface IFileExplorer {
    GetChildNodes(path: FileExplorerItem): Promise<OCIFileExplorerNode[]>;
}

export interface FileExplorerItem {
    uri: Uri;
    type: FileType;
}

