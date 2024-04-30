/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import {
    ConfigFileAuthenticationDetailsProvider,
    AuthenticationDetailsProvider,
    SessionAuthDetailProvider,
} from 'oci-common';
import { IOCIProfile } from '../profilemanager/profile';
import { IOCIProfileTreeDataProvider } from '../userinterface/profile-tree-data-provider';
import { IOCICompartment } from '../userinterface/compartment';
import { IOCIApi, NodeCreatorFunc } from './oci-api';
import { ProfileManager } from '../profilemanager/profile-manager';
import assert from '../util/assert';
import { isTokenExpired } from '../util/token';
import {
    getConfigFilePath,
    configFileExists,
    getProfileNames,
} from '../profilemanager/profile-config';
import { signIn } from '../commands/sign-in-command';
import { OCIProfileTreeDataProvider } from '../tree/oci-profile-tree-data-provider';
import { ext } from '../extension-vars';
import * as regions from '../regions/fetch-regions';
import { getCompartmentById, getCompartmentByIdOrName, getCompartments } from './oci-sdk-client';
import { getCompartmentsWithResourceTypes, isResourceFoundInCompartment } from './compartments-with-resource-search';
import { getLogger } from '../logger/logging';
import { OciExtensionError } from '../errorhandler';
import { GetCompartmentResponse } from 'oci-identity/lib/response/get-compartment-response';
import { getWebView } from '../webviews/create-webview';
import { createDirectoryNode, createFileExplorer, FileExplorerItem } from '../util/fileExplorer';
import { createFile, createDirectory, deleteFile, deleteFiles, deleteDirectory } from '../util/file-utils';
import { getArtifactsSandboxFolder, getDefaultArtifactFolderPath } from './oci/local-artifact';
import * as nls from 'vscode-nls';

const logger = getLogger("oci-vscode-toolkit");
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

// Holds the implementation of the public API
export class OCIApiHelper {
    constructor() {
        // Empty
    }

    api: IOCIApi = {
        getOCIAuthProvider: (profileName: string) =>
            this.getOCIAuthProvider(profileName),
        getProfiles: () => this.getProfiles(),
        getProfile: (profileName: string) => this.getProfile(profileName),
        signIn: (
            profileName?: string,
            regionName?: string,
            cancellationToken?: vscode.CancellationToken,
        ) => signIn(profileName, regionName, cancellationToken),
        getCurrentProfile: () => this.getCurrentProfile(),
        createProfileTreeProvider: (
            rootNodeCreatorFunc?: NodeCreatorFunc,
            profileChildrenCreatorFunc?: NodeCreatorFunc,
        ) =>
            this.createProfileTreeProvider(
                rootNodeCreatorFunc,
                profileChildrenCreatorFunc,
            ),

        // Gets the URL to the UI console
        getConsoleUrl: (regionName: string) => this.getConsoleUrl(regionName),

        // Gets all compartments from the current profile
        getAllCompartments: () => this.getAllCompartments(),
        getCompartmentById: (compartmentId: string) => this.getCompartmentByOcid(compartmentId),
        getCompartmentByIdOrName: (compartmentInfo: string) => getCompartmentByIdOrName(compartmentInfo),
        getCompartmentsWithResourceTypes: (resourceTypes: string[], parentCompartmentId: string) => getCompartmentsWithResourceTypes({resourceTypes, parentCompartmentId }),
        isResourceFoundInCompartment: (resourceTypes: string[], compartmentId: string) => isResourceFoundInCompartment(resourceTypes, compartmentId),

        accountExists: () => configFileExists(),

        getRegions: () => regions.Regions,
        getLogger: (channelName: string) => getLogger(channelName),

        getRegion: () => this.getRegion(),
        getWebView: (extensionUri: vscode.Uri, viewType: string, title: string) => getWebView(extensionUri, viewType, title),
        createFileExplorer: (path: FileExplorerItem) => createFileExplorer(path),
        createDirectoryNode: (directoryPath: string, canBeDeleted: boolean, isTopDirectory: boolean, label: string | undefined) => createDirectoryNode(directoryPath, canBeDeleted, isTopDirectory, label),
        deleteFile: (fsPath: string) => deleteFile(fsPath),
        deleteFiles: (listOfFsPath: string[]) => deleteFiles(listOfFsPath),
        deleteDirectory: (fsPath: string) => deleteDirectory(fsPath),
        createFile: (fsPath: string) => createFile(fsPath),
        createDirectory: (fsPath: string) => createDirectory(fsPath),

        // Events
        onProfileChanged: ext.onProfileChangedEventEmitter.event,
        onSignInCompleted: ext.onSignInCompletedEventEmitter.event,
        onResourceNodeClicked: ext.onResourceNodeClickedEventEmitter.event,
        onAccountCreated: ext.onAccountCreatedEventEmitter.event,

        // Local Artifact management
        getDefaultArtifactFolderPath: (subFolderPath: string) => getDefaultArtifactFolderPath(subFolderPath),
        getArtifactsSandboxFolder: (subFolderPath: string) => getArtifactsSandboxFolder(subFolderPath),

    };

    private async getAllCompartments(): Promise<IOCICompartment[]> {
        const p = this.getCurrentProfile();

        return getCompartments({
            profile: p.getProfileName(),
            rootCompartmentId: p.getTenancy(),
            allCompartments: true,
        });
    }

    private async getCompartmentByOcid(compartmentId: string): Promise<GetCompartmentResponse> {
        const p = this.getCurrentProfile();
        return getCompartmentById({ profile: p.getProfileName(), compartmentId });
    }

    private getCurrentProfile(): IOCIProfile {
        let profileName:
            | string
            | undefined = vscode.workspace
                .getConfiguration()
                .get('oci.defaultProfileName');
        assert(profileName, 'profileName');

        const allProfiles = getProfileNames();

        // Check if the profile name from the config exists
        // If not, we use the first profile name we find in the file
        // as the default one + change the configuration to that as well
        if (!allProfiles.includes(profileName)) {
            profileName = allProfiles[0];
            vscode.workspace
                .getConfiguration()
                .update('oci.defaultProfileName', profileName);
        }

        let profile = this.getProfile(profileName);
        if (this.api.getRegion()) {
            profile.setRegionName(this.api.getRegion()!);
        }

        return profile;
    }

    private async getConsoleUrl(regionName: string): Promise<string> {
        const realm = regions.getRealmName(regionName);
        return `https://console.${regionName}.${realm}`;
    }

    private getRegion(): string | undefined {
        return this.api.region;
    }

    private createProfileTreeProvider(
        rootNodeCreatorFunc?: NodeCreatorFunc,
        profileChildrenCreatorFunc?: NodeCreatorFunc,
    ): IOCIProfileTreeDataProvider {
        let fileExists = true;
        let defaultProfile: IOCIProfile = {} as IOCIProfile;

        if (this.api.accountExists()) {
            defaultProfile = this.api.getCurrentProfile();
        } else {
            const profileTreeProviderErrorMsg = localize("profileTreeProviderErrorMsg", "Failed because of missing file while creating Profile tree provider");
            // Assuming it fails because of a missing file
            vscode.window.showErrorMessage(profileTreeProviderErrorMsg);
            fileExists = false;
            vscode.commands.executeCommand(
                'setContext',
                'OCIConfigExists',
                false,
            );
        }
        return new OCIProfileTreeDataProvider(
            defaultProfile,
            fileExists,
            rootNodeCreatorFunc,
            profileChildrenCreatorFunc,
        );
    }

    private getProfile(profileName: string) {
        return new ProfileManager(profileName);
    }

    private getProfiles(): IOCIProfile[] {
        return getProfileNames().map((p) => this.getProfile(p));
    }

    // Retruns the OCI auth provider that can be used to make calls to the OCI API
    private async getOCIAuthProvider(
        profileName: string,
    ): Promise<AuthenticationDetailsProvider> {
        try {
            const profileManager = new ProfileManager(profileName);
            let changedRegion = this.api.getRegion();

            if (profileManager.usesSessionAuth()) {
                const sessionAuthProvider = new SessionAuthDetailProvider(undefined, profileName);
                if (changedRegion) {
                    sessionAuthProvider.setRegion(changedRegion);
                }
                const currentToken = profileManager.getSecurityToken();
                assert(currentToken, 'currentToken');
                // Refresh the token if needed
                if (isTokenExpired(currentToken)) {
                    const region = sessionAuthProvider.getRegion().regionId;

                    let refreshedToken: string;
                    try {
                        refreshedToken = await sessionAuthProvider.refreshSessionToken();
                    } catch (err) {
                        const tokenExpiredErrorMsg = localize("tokenExpiredErrorMsg", "Token has expired. Please sign-in again");
                        const signInAction = localize("signInAction", "Sign-in");
                        const r = await vscode.window.showErrorMessage(
                            tokenExpiredErrorMsg,
                            signInAction,
                        );
                        if (r === signInAction) {
                            await vscode.window.withProgress<string | undefined>(
                                {
                                    location: vscode.ProgressLocation.Notification,
                                    cancellable: true,
                                },
                                async (progress) => {
                                    const signingInMsg = localize("signingInMsg", "Signing in...");
                                    progress.report({ message: signingInMsg });
                                    return ext.api.signIn(profileName, region);
                                },
                            );
                            await vscode.commands.executeCommand("workbench.action.reloadWindow");
                        }
                        return Promise.reject();
                    }
                    profileManager.updateSecurityToken(refreshedToken);
                }
                return sessionAuthProvider;
            }

            const configPath = getConfigFilePath();
            let authProvider = new ConfigFileAuthenticationDetailsProvider(
                configPath,
                profileName,
            );
            if (changedRegion) {
                authProvider.setRegion(changedRegion);
            }
            return authProvider;
        }
        catch (exception) {
            const authProviderErrorMsg = localize("authProviderErrorMsg", "Error in creating auth provider for OCI API calls ");
            logger.error(authProviderErrorMsg, JSON.stringify(exception));
            vscode.window.showErrorMessage(authProviderErrorMsg, exception);
            throw new OciExtensionError(exception);
        }
    }
}
