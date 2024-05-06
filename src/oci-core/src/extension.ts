/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import {
    ExtensionContext,
    EventEmitter, commands, window
} from 'vscode';
import { IOCIProfile } from './profilemanager/profile';
import { IRootNode } from './userinterface/root-node';
import { ext } from './extension-vars';
import { OCIApiHelper } from './api/oci-api-helper';
import { getCloudShellConfigIfExists } from './profilemanager/profile-config';
import { installOCICLI } from './commands/install-oci-cli';
import { setupStatusBar, updateRegionStatusBar, updateProfileStatusBar } from './ui/status-bar';
import { setupTreeView } from './ui/tree-view';
import { registerCommands, registerNavigationCommands } from './ui/commands/register-commands';
import { OciExtensionError } from './errorhandler/oci-plugin-error';

export async function activate(context: ExtensionContext) {
    commands.executeCommand('setContext', 'OCIConfigExists', true);
    commands.executeCommand('setContext', 'enableOCICoreViewTitleMenus', false);
    ext.hasAccount = true;

    // Create event emitters
    ext.onProfileChangedEventEmitter = new EventEmitter<IOCIProfile>();
    ext.onSignInCompletedEventEmitter = new EventEmitter<string>();
    ext.onResourceNodeClickedEventEmitter = new EventEmitter<IRootNode>();
    ext.onAccountCreatedEventEmitter = new EventEmitter<void>();

    // Create the api
    const ociAccount = new OCIApiHelper();
    ext.context = context;
    ext.api = ociAccount.api;

    // Check if the config file exists, so we can register the view accordingly
    const ociAccountExists = ext.api.accountExists();
    // Setup Status Bar
    const regionStatusBarItem = await setupStatusBar("switchRegion");
    const profileStatusBarItem = await setupStatusBar("switchProfile");

    if (!ociAccountExists) {
        commands.executeCommand('setContext', 'OCIConfigExists', false);
        ext.hasAccount = false;
        if (!getCloudShellConfigIfExists()) {
            updateRegionStatusBar(regionStatusBarItem);
            updateProfileStatusBar(profileStatusBarItem);
        }
    }

    if (!getCloudShellConfigIfExists()) {
        await installOCICLI();
    }

    // Register all commands (except the navigation ones)
    registerCommands(context, regionStatusBarItem, profileStatusBarItem);
    if (ociAccountExists) {
        try {
            await setupTreeView();
            await registerNavigationCommands(ext.context);

            if (!getCloudShellConfigIfExists()) {
                updateRegionStatusBar(regionStatusBarItem, ext.api.getCurrentProfile().getRegionName());
                updateProfileStatusBar(profileStatusBarItem, ext.api.getCurrentProfile().getProfileName());
            }
            ext.api.onSignInCompleted((profile: string) =>
                ext.treeDataProvider.refresh(undefined),
            );
            return Promise.resolve(ociAccount.api);
        }
        catch (error) {
            if (error instanceof OciExtensionError) {
                const ociExtensionError = error;
                if ((ociExtensionError.statusCode === 404) && ociExtensionError.serviceError && (ociExtensionError.serviceError.serviceCode === 'NotAuthorizedOrNotFound')) {
                    commands.executeCommand('setContext', 'UnAuthorizedAccess', true);
                    window.showErrorMessage(`Activating extension 'Oracle.oci-core' failed: ${ociExtensionError.message}`, { modal: false });
                }
            }
            throw error;
        }
    }
}

export function deactivate() { }
