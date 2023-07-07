/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as nls from 'vscode-nls';
import {
    ExtensionContext, window,
    commands,
    workspace,
    env,
    Uri, MessageItem,
    ProgressLocation, TextDocument,
    ViewColumn,
    TreeItem,
    StatusBarItem
} from 'vscode';
import { IOCIProfileNode } from '../../userinterface/profile-node';
import { IOCIProfile } from '../../profilemanager/profile';
import { IRootNode } from '../../userinterface/root-node';
import { ext } from '../../extension-vars';
import {
    IOCIResourceNode
} from '../../userinterface/oci-compartment-node';
import assert from '../../util/assert';
import { treeNodeCommands, createFullCommandName } from '../../util/resources';
import { copyOCID } from '../../commands/copy-ocid';
import { switchProfile } from '../../commands/switch-profile';
import { switchRegion } from '../../commands/switch-region';
import { signIn } from '../../commands/sign-in-command';
import { filterResources } from '../../commands/filter-resources';
import { CreateWebView } from '../../webviews';
import { getCloudShellConfigIfExists } from '../../profilemanager/profile-config';
import { getFileTypeStats } from '../../common/fileSystem/filesystem';
import { gettingStarted } from '../../commands/walkthrough';
import { updateRegionStatusBar, updateProfileStatusBar } from '../../ui/status-bar';
import { setupTreeView } from '../../ui/tree-view';
import { getLogger } from '../../logger/logging';
import { enableInteractiveCLI } from '../../commands/install-oci-cli';
nls.config({ messageFormat: nls.MessageFormat.bundle, bundleFormat: nls.BundleFormat.standalone })();

const localize: nls.LocalizeFunc = nls.loadMessageBundle();
const logger = getLogger("oci-vscode-toolkit");

// This should only be called if there's an OCI account set
export async function registerNavigationCommands(context: ExtensionContext) {
    context.subscriptions.push(
        commands.registerCommand(
            createFullCommandName('resourceFilter'),
            async (node) => {
                const needsUpdate = await filterResources();
                if (needsUpdate) {
                    ext.treeDataProvider.refresh(node);
                }
            },
        ),
    );

    context.subscriptions.push(
        commands.registerCommand(createFullCommandName('refreshTree'), () => {
            ext.treeDataProvider.refresh(undefined);
        }),
    );

    commands.executeCommand('setContext', 'enableOCICoreViewTitleMenus', true);
}

export async function registerCommands(context: ExtensionContext, regionStatusBarItem: StatusBarItem, profileStatusBarItem: StatusBarItem) {
    gettingStarted(context);

    context.subscriptions.push(
        commands.registerCommand(
            createFullCommandName('viewInBrowser'),
            async (node: IOCIResourceNode) => {
                const consoleUrl = node.getConsoleUrl(ext.api.getCurrentProfile().getRegionName());
                assert(consoleUrl);
                await env.openExternal(Uri.parse(await consoleUrl));
            },
        ),
    );

    ext.context.subscriptions.push(profileStatusBarItem);
    ext.context.subscriptions.push(regionStatusBarItem);

    ext.context.subscriptions.push(
        ext.api.onProfileChanged((profile: IOCIProfile) => {
            updateProfileStatusBar(profileStatusBarItem, profile.getProfileName());
        }));

    ext.context.subscriptions.push(
        ext.api.onSignInCompleted((profile: string) => {
            updateProfileStatusBar(profileStatusBarItem, profile);
        }));

    context.subscriptions.push(
        commands.registerCommand(
            createFullCommandName('copyOCID'),
            async (node: IOCIResourceNode) => {
                const compartmentId = node.getResourceId();
                assert(compartmentId);
                copyOCID(compartmentId);
            },
        ),
    );
    await registerTreeNodeCommands(ext.context, treeNodeCommands);

    context.subscriptions.push(
        commands.registerCommand(createFullCommandName('view-sample-webview'), async () => {
            try {
                const webView = new CreateWebView(context.extensionUri, 'WebView', 'Sample Webview');
                const sampleWebViewText = localize("sampleWebViewText", "This is Sample WebView Wizard allows you build your view");
                webView.loadView(`<b>Note: </b>  ${sampleWebViewText}`);
            } catch (error) {
                const sampleWebViewErrorMsg = localize("sampleWebViewErrorMsg", "Error occured in opening sample web view");
                logger.error(sampleWebViewErrorMsg);
                throw error;
            }
        }),
    );

    context.subscriptions.push(
        commands.registerCommand(
            createFullCommandName('switchRegion'),
            async (regionToChange?: string) => {
                try {
                    if (typeof regionToChange === 'string' && regionToChange && getCloudShellConfigIfExists()) {
                        // Command called from code editor with arg
                        ext.api.region = regionToChange;
                    }
                    else {
                        // Command called from from vscode
                        let newRegion = await switchRegion(ext.api.getCurrentProfile());
                        // Return if user canceled out of the UI
                        if (!newRegion) {
                            return;
                        }
                        ext.api.region = newRegion.regionName;
                        updateRegionStatusBar(regionStatusBarItem, newRegion.regionName);
                    }
                    ext.onProfileChangedEventEmitter.fire(ext.api.getCurrentProfile());
                } catch (error) {
                    const switchRegionErrorMsg = localize("switchRegionErrorMsg", "Error occured in changing region ");
                    logger.error(switchRegionErrorMsg, error);
                }
            },
        ),
    );

    context.subscriptions.push(
        commands.registerCommand(
            createFullCommandName('signIn'),
            async (node: IOCIProfileNode) => {
                if (node === undefined) {
                    ext.treeDataProvider.refresh(undefined);
                    return;
                }
                const region = node.regionName;
                const profileName = node.profileName;
                assert(region);
                assert(profileName);

                const profile = await window.withProgress<string | undefined>(
                    {
                        location: ProgressLocation.Notification,
                        cancellable: true,
                    },
                    async (progress, token) => {
                        const signInMsg = localize("signInMsg", "Signing in...");
                        progress.report({ message: signInMsg });
                        return signIn(profileName, region, token);
                    },
                );
            },
        ),
    );

    context.subscriptions.push(
        commands.registerCommand(
            createFullCommandName('createNewProfile'),
            async (node: any) => {
                let existingProfileName: string | undefined = undefined;

                // If node is undefined, it means the command was called from the welcome view,
                // hence we don't prompt for profile and set it to DEFAULT instead.
                if (!node) {
                    existingProfileName = 'DEFAULT';
                }

                const profileName = await window.withProgress<
                    string | undefined
                >(
                    {
                        location: ProgressLocation.Notification,
                        cancellable: true,
                    },
                    async (progress, token) => {
                        const createNewProfileMsg = localize("createNewProfileMsg", "Creating new profile...");
                        progress.report({ message: createNewProfileMsg });
                        return signIn(existingProfileName, undefined, token);
                    },
                );

                if (!profileName) {
                    // User exited the UI
                    return;
                }

                if (!ext.hasAccount) {
                    // If we didn't have an account/config file before,
                    // we need to setup tree view.
                    commands.executeCommand(
                        'setContext',
                        'OCIConfigExists',
                        true,
                    );
                    await registerNavigationCommands(ext.context);
                    await setupTreeView();
                    ext.hasAccount = true;
                    ext.onAccountCreatedEventEmitter.fire();
                    await commands.executeCommand("workbench.action.reloadWindow");
                }
            },
        ),
    );

    context.subscriptions.push(
        commands.registerCommand(
            createFullCommandName('switchProfile'),
            async () => {
                const newProfile = await switchProfile();

                // Return if user canceled out of the UI
                if (!newProfile) {
                    return;
                }

                if (!workspace.workspaceFolders) {
                    const open: MessageItem = { title: 'Open Folder' };
                    const msg = localize("switchProfileOpenFolderMsg", "Failed to switch the profile because the folder is not open in a workspace. Open a folder and try again.");
                    await window.showWarningMessage(msg, { modal: true }, open);
                    await commands.executeCommand('vscode.openFolder');
                }
                // Change the profile setting
                const cfg = workspace.getConfiguration('oci');

                await cfg.update(
                    'defaultProfileName',
                    newProfile.getProfileName(),
                );
                ext.onProfileChangedEventEmitter.fire(newProfile);
            },
        ),
    );

    context.subscriptions.push(
        commands.registerCommand(
            createFullCommandName('newOCIAccount'),
            async () => {
                await env.openExternal(
                    Uri.parse(
                        'https://signup.cloud.oracle.com',
                    ),
                );
            },
        ),
    );

    context.subscriptions.push(
        commands.registerCommand(
            createFullCommandName('resourceNodeClicked'),
            async (node: IRootNode) => {
                // TODO: Implement findTreeItem and treeView.reveal
            },
        ),
    );

    context.subscriptions.push(
        commands.registerCommand(
            createFullCommandName('OpenFile'),
            (fileUri: Uri) => {
                if (getFileTypeStats(fileUri.fsPath).isFile()) {
                    workspace.openTextDocument(fileUri).then((doc: TextDocument) => {
                        window.showTextDocument(doc, ViewColumn.Active, true);
                    }, (error: any) => {
                        const openFileErrorMsg = localize("openFileErrorMsg", "Error opening file ");
                        logger.error(openFileErrorMsg, fileUri);
                        throw error;
                    });
                }
            })
    );

    context.subscriptions.push(
        commands.registerCommand(createFullCommandName('toggleInteractiveCLI'), async () => {
            enableInteractiveCLI(context);
    }),
    );
}

async function registerTreeNodeCommands(context: ExtensionContext, commandNames: string[]) {
    commandNames.length > 0 && commandNames.forEach((commandName) => {
        context.subscriptions.push(
            commands.registerCommand(commandName,
                async (_: TreeItem) => {
                })
        );
    });
}
