/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { AuthenticationDetailsProvider } from 'oci-common';
import { IOCIProfile } from '../profilemanager/profile';
import { IOCIProfileTreeDataProvider } from '../userinterface/profile-tree-data-provider';
import { IOCICompartment } from '../userinterface/compartment';
import { Event, CancellationToken } from 'vscode';
import { IRootNode } from '../userinterface/root-node';
import { IRegion } from '../regions/region';
import { LOG } from '../logger/logging';
import { Uri } from "vscode";
import { GetCompartmentResponse } from 'oci-identity/lib/response/get-compartment-response';
import { CreateWebView } from '../webviews/create-webview';
import { FileExplorerItem } from '../util/fileExplorer';
import { OCIFileExplorerNode } from '../tree/oci-file-explorer-node';
import { SandboxFolder } from '../common/fileSystem/sandbox-folder';

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

    // Sets changed region from console or prompt
    region?: string;

    getRegion: () => string | undefined;

    // Gets all regions
    getRegions: () => IRegion[];

    //Gets logger channel
    getLogger: (channelName: string) => LOG;

    // Fetches the Compartment wrt provided ocid
    getCompartmentById: (compartmentId: string) => Promise<GetCompartmentResponse>;

    // Fetches the Compartment wrt provided ocid or name
    getCompartmentByIdOrName: (compartmentName: string) => Promise<IOCICompartment | undefined>;

    // Fetches the Compartments with type of the resource
    getCompartmentsWithResourceTypes: (resourceTypes: string[], parentCompartmentId: string) => Promise<IOCICompartment[]>;
    isResourceFoundInCompartment: (resourceTypes: string[], compartmentId: string) => Promise<Boolean>;
    getWebView: (extensionUri: Uri, viewType: string, title: string) => CreateWebView;

    //Gets a list of immediate children for the given path (files/folders), each element is of type `OCIFileExplorerNode`
    createFileExplorer: (path: FileExplorerItem) => Promise<OCIFileExplorerNode[]>;

    createDirectoryNode: (directoryPath: string, canBeDeleted: boolean, isTopDirectory: boolean, label: string | undefined) => OCIFileExplorerNode;

    //deletes the file in the file system path provided        
    deleteFile: (fsPath: string) => void;

    //deletes list of files wrt file system paths provided
    deleteFiles: (listOfFsPath: string[]) => void;

    //delete folder wrt file system path provided
    deleteDirectory: (fsPath: string) => void;

    //create file wrt file system path provided
    createFile: (fsPath: string) => void;

    //create folder wrt file system path provided
    createDirectory: (fsPath: string) => void;

    // returns the folder path of the  service plugin local artifacts
    getDefaultArtifactFolderPath: (subFolderPath: string) => string;

    // returns the SandboxFolder facade to manage the life-cycle of the  service plugin local artifacts
    getArtifactsSandboxFolder: (subFolderPath: string) => SandboxFolder;
}
