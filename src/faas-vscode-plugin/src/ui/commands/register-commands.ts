/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import { window } from 'vscode';
import { CreateNewOCIApplication, CreateOCIFunction, DeleteOCIFunction, DeleteOCIApplication, DeployOCIFunction, EditConfiguration, EditOCIApplication, EditFunctionSettings, EditOCIFunction, ExpandCompartment, InvokeOCIFunction, ListResource, OCIConfigurationFunctionRootNodeItem, ShowDocumentation, SignInItem, launchWorkFlowCommand, FocusFunctionsPlugin, SwitchRegion, OpenIssueInGithub, createFullCommandName } from './resources';
import { ext } from '../../extensionVars';
import { IOCIProfileTreeDataProvider, IRootNode, OCIFileExplorerNode } from '../../oci-api';
import { IActionResult, isCanceled, hasFailed } from '../../utils/actionResult';
import { OCICompartmentNode } from "../tree/nodes/oci-compartment-node";
import { EditConfigurationGetWebviewContent } from "../../webViews/EditConfigurationPanel";
import { deleteOCIApplication, deleteOCIFunction, getApplication, getFunction, getFunctions, invokeFunction, updateApplicationConfig, updateFunctionConfig, updateFunctionSettings } from "../../api/function";
import { logger } from "../../utils/get-logger";
import { EditFunctionSettingsGetWebview } from '../../webViews/EditFunctionSettingsPanel';
import { OCIFunctionNode } from '../tree/nodes/oci-function-node';
import { OCIApplicationNode } from '../tree/nodes/oci-application-node';
import { createFunctionFromTemplate } from './createFunction/create-fn-template';
import { createFunctionFromCodeRepository } from './createFunction/create-fn-repo';
import { createFunctionFromSample } from './createFunction/create-fn-sample';
import { OCINewFunctionNode, OCINewFunctionType } from '../tree/nodes/oci-new-function-node';
import { deployFunction, reportResult } from './deployFunction/deploy-fn';
import { DeployFunctionGetWebview } from '../../webViews/DeployFunction';
import { getUserInfo } from '../../api/identity';
import { editFunction } from './edit-fn';
import parseYaml from '../../utils/parsers';
import path = require('path');
import { launchWorkFlow, revealTreeNode } from './launchWorkflow/launch';
import { isPayloadValid } from '../../common/validations/launchPayload';
import { handleResult } from './createFunction/show-message';
import { isGitRepo } from './deployFunction/check-git-repo';
import { getDeployFunction } from './deployFunction/get-deploy-repo';
import * as nls from 'vscode-nls';
import { getDirectoryName } from 'oci-ide-plugin-base/dist/common/fileSystem/filesystem';
import { METRIC_INVOCATION, METRIC_SUCCESS, METRIC_FAILURE } from 'oci-ide-plugin-base/dist/monitoring/monitoring';
import { Service } from 'oci-ide-plugin-base/dist/monitoring/service';
import { MONITOR } from '../../common/monitor';
import { getArtifactHook } from '../../common/fileSystem/local-artifact';
import { streamToString } from '../../utils/streamUtils';
import { listRecentCommands } from 'oci-ide-plugin-base/dist/extension/ui/features/command-manager';
import { executeUserCommand, _appendCommandInfo } from './ui/list-recent-commands';
import { getNamespaceForTenancy, getNamespaceForUser } from '../../api/objectStorage';
import { RootNode } from '../tree/nodes/rootNode';
import { createNewOCIApplication } from "./createApplication/create-new-oci-application";

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

// Runs an action with status bar and progress image.
// It can also execute specified function on success or on cancelation.
function runWithStatusBarMessage(
    func: Promise<IActionResult>,
    message: string,
    onSucceeded?: (result: IActionResult) => void,
    onCanceled?: () => void,
    onFailed?: (result: IActionResult) => void,
) {
    const progressOptions = {
        location: vscode.ProgressLocation.Notification,
        title: message,
        cancellable: false,
    };

    return vscode.window.withProgress<IActionResult>(
        progressOptions,
        async (p: any) => {
            const disposable = vscode.window.setStatusBarMessage(message);
            const funcResult = await func;

            if (isCanceled(funcResult)) {
                if (onCanceled) {
                    onCanceled();
                }
                disposable.dispose();
                return funcResult;
            }

            if (hasFailed(funcResult)) {
                if (onFailed) {
                    onFailed(funcResult);
                }
                disposable.dispose();
                return funcResult;
            }

            if (onSucceeded) {
                onSucceeded(funcResult);
            }

            disposable.dispose();
            return funcResult;
        },
    );
}

async function registerEditConfigurationCommand(
    context: vscode.ExtensionContext,
    commandName: string,
    profileName: string,
    node: OCIFunctionNode | OCIApplicationNode,
    config: { [key: string]: string } | undefined,
    updater: (profileName: string, id: string, config: { [key: string]: string }) => Promise<any>
) {
    _appendCommandInfo(commandName, node);
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, commandName, undefined));
    const webviewTitle = localize("editConfigurationTitle", "Edit configuration");
    let panel = vscode.window.createWebviewPanel("editConfiguration", webviewTitle, vscode.ViewColumn.One, {
        enableScripts: true,
    });
    panel.webview.html = EditConfigurationGetWebviewContent(panel.webview, context.extensionUri, config !== undefined ? config : {});
    panel.webview.onDidReceiveMessage(
        (message: { command: any; value: any; }) => {
            switch (message.command) {
                case 'updateKeyValuePairs':
                    const updatedConfig = message.value;
                    updater(profileName, node.id, updatedConfig);
                    return;
            }
        },
        undefined,
        context.subscriptions
    );
}

export function registerCommands(
    context: vscode.ExtensionContext,
    dataProvider: IOCIProfileTreeDataProvider,
): void {
    const refreshNode = (node: RootNode | undefined): void => dataProvider.refresh(node);
    ext.api.onSignInCompleted(() => dataProvider.refresh(undefined));

    context.subscriptions.push(
        vscode.commands.registerCommand(SignInItem.commandName, async () => {
            _appendCommandInfo(SignInItem.commandName, undefined);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, SignInItem.commandName, undefined));
            const profileName = await vscode.window.withProgress<string | undefined>(
                {
                    location: vscode.ProgressLocation.Notification,
                    cancellable: true,
                },
                async (progress: any, token: any) => {
                    progress.report({
                        message: localize("signInChannelMessage", 'Signing in...')
                    });
                    return ext.api.signIn(undefined, undefined, token);
                },
            );
            if (profileName) {
                dataProvider.refresh(undefined);
            }
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            CreateNewOCIApplication.commandName,
            async (node: OCICompartmentNode) => {
                _appendCommandInfo(CreateNewOCIApplication.commandName, node);
                const compartmentId = node.getResourceId();
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, CreateNewOCIApplication.commandName, compartmentId));
                return runWithStatusBarMessage(
                    createNewOCIApplication(node.compartment.id!),
                    localize('createNewApplicationMessage', 'Creating new application...'),
                    () => refreshNode(node)
                )
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            DeleteOCIApplication.commandName,
            async (node: OCIApplicationNode) => {
                _appendCommandInfo(DeleteOCIApplication.commandName, node);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, DeleteOCIApplication.commandName, node.resource.compartmentId!, node.resource.id));

                const profile = ext.api.getCurrentProfile().getProfileName();
                const functions = await getFunctions(profile, node.appSummary.id!);
                if (functions.length != 0) {
                    const prompt = localize('deleteAppConfirmation', 'The selected application contains {0} functions, delete anyway?', functions.length)
                    const yes = localize('yes', 'Yes');
                    const no = localize('no', 'No');
                    const answer = await vscode.window.showInformationMessage(prompt, yes, no);
                    if (answer === yes) {
                        for (const f of functions) {
                            await deleteOCIFunction(f.id!, profile);
                        }
                        await deleteOCIApplication(node.appSummary.id!, profile);
                    }
                } else {
                    await deleteOCIApplication(node.appSummary.id!, profile);
                }
            }
        ));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            EditOCIApplication.commandName,
            async (node: OCIApplicationNode) => {
                const profileName = ext.api.getCurrentProfile().getProfileName();
                const config = (await getApplication(profileName, node.id)).config;
                await registerEditConfigurationCommand(context, OCIConfigurationFunctionRootNodeItem.commandName, profileName, node, config, updateApplicationConfig);
            }
        ));
}

export async function registerItemContextCommands(context: vscode.ExtensionContext, dataProvider: IOCIProfileTreeDataProvider,) {
    context.subscriptions.push(
        vscode.commands.registerCommand(
            InvokeOCIFunction.commandName,
            async (node: OCIFunctionNode) => {
                _appendCommandInfo(InvokeOCIFunction.commandName, node);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, InvokeOCIFunction.commandName, node.func.compartmentId!, node.func.id));
                let functionID = "";
                let functionDisplayName = "";
                window.withProgress<void>(
                    {
                        location: vscode.ProgressLocation.Notification,
                        cancellable: false,
                    },
                    async (progress: any) => {
                        let invokeChannel = undefined;
                        try {
                            invokeChannel = vscode.window.createOutputChannel("Invoke function");
                            functionID = node.func.id!;
                            functionDisplayName = node.func.displayName!;
                            progress.report({
                                message: localize("invokeChannelMessage", "Invoking Function ") + functionDisplayName + "()...",
                            });

                            let response = await invokeFunction(ext.api.getCurrentProfile().getProfileName(), functionID);
                            invokeChannel.show();
                            let functionOutput = await streamToString(response.value);
                            if (functionOutput !== undefined) {
                                invokeChannel.append(functionOutput + "\n");
                            } else {
                                invokeChannel.append(localize("unableParseFnOutputMessage", "Unable to parse function output.\n"));
                            }
                            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, InvokeOCIFunction.commandName, node.func.compartmentId!, node.func.id));
                        } catch (error) {
                            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, InvokeOCIFunction.commandName, node.func.compartmentId!, node.func.id, '' + error));
                            vscode.window.showErrorMessage(`${localize("failedInvokeMessage", "Failed to invoke function")} ${functionDisplayName}(). \n\n ${localize("seeConsoleMessage", "See console and log for more details")}.`, { modal: true }
                            );
                            if (invokeChannel !== undefined) {
                                invokeChannel.show();
                                invokeChannel.append(`\n ${localize("failedInvokeMessage", "Failed to invoke function {0}() with {1} {2} due to {3}"), functionDisplayName, 'ocid', functionID, error}`);
                            }
                            logger().error(`\n ${localize("failedInvokeMessage", "Failed to invoke function {0}() with {1} {2} due to {3}"), functionDisplayName, 'ocid', functionID, error}`);
                        }
                    }
                );
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(CreateOCIFunction.commandName, (app: OCIApplicationNode) => {
            _appendCommandInfo(CreateOCIFunction.commandName, app);
            const picker: vscode.QuickPick<vscode.QuickPickItem> = newCreateFunctionPicker(app, context, dataProvider);
            picker.show();
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(DeleteOCIFunction.commandName, () => {
            _appendCommandInfo(DeleteOCIFunction.commandName, undefined);
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(EditOCIFunction.commandName, async (f: OCIFunctionNode) => {
            _appendCommandInfo(EditOCIFunction.commandName, f);
            try {
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, EditOCIFunction.commandName, f.func.compartmentId!, f.func.id));
                handleResult(await editFunction(f, dataProvider));
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, EditOCIFunction.commandName, f.func.compartmentId!, f.func.id));
            } catch (error) {
                logger().error(`${localize("editFailedMessage", "Edit function failed")}: `, error);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, EditOCIFunction.commandName, f.func.compartmentId!, f.func.id, '' + error));
                throw error;
            }
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(DeployOCIFunction.commandName, async (currFunc: (OCINewFunctionNode | OCIFunctionNode)) => {
            const current_profile = ext.api.getCurrentProfile();
            if (!current_profile.getUser()) {
                const userMissingMessage = localize("userMissingMessage", "The config file is missing 'user' field, please edit the config file and add 'user' field\n\nExample: 'user: ocid1.user.oc1..xyz'");
                vscode.window.showInformationMessage(userMissingMessage, { modal: true });
                return;
            }
            _appendCommandInfo(DeployOCIFunction.commandName, currFunc);
            try {
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, DeployOCIFunction.commandName, currFunc.resource.compartmentId!, currFunc.resource.id));
                var is_git_repo: boolean = await isGitRepo(currFunc);
                if (!is_git_repo) {
                    vscode.window.showInformationMessage(
                        `${localize("codeDeployGitMessage", "The code can only be deployed from a git repository.\n Please push the code to a git repository from folder")} ${currFunc.uriRepo?.fsPath}`,
                        { modal: false }
                    );
                } else {
                    let deploy_repo = await getDeployFunction(currFunc);
                    var doc = parseYaml(path.join(deploy_repo.rootUri.fsPath, 'func.yaml'));
                    const funcNameFromFile = doc['name'];
                    if (funcNameFromFile !== currFunc.func.displayName) {
                        vscode.window.showErrorMessage(localize('funcNameErrorMessage', 'The function name in func.yaml is different than the name of the existing function.'), { modal: true });
                    } else {
                        let panel = vscode.window.createWebviewPanel("deployFunction", "Deploy Function", vscode.ViewColumn.One, {
                            enableScripts: true
                        });
                        panel.webview.html = DeployFunctionGetWebview(panel.webview, context.extensionUri, currFunc);

                        panel.webview.onDidReceiveMessage(async (message: { command: any; authToken: any; registryLocation: any; timeoutInSeconds: any; memoryInMBs: any; verboseLevel: any; }) => {
                            switch (message.command) {
                                case 'deploy_function':
                                    const current_profile = await ext.api.getCurrentProfile();
                                    const profile_name = current_profile.getProfileName();
                                    const comparment = await ext.api.getCompartmentById(currFunc.parent!.appSummary!.compartmentId!);
                                    const userObj = await getUserInfo(current_profile.getUser(), profile_name);
                                    const registryName = await getNamespaceForTenancy(profile_name, ext.api.getCurrentProfile().getTenancy());
                                    const userNamespace = await getNamespaceForUser(profile_name);
                                    const result = await vscode.window.withProgress<IActionResult>(
                                        { location: vscode.ProgressLocation.Notification, cancellable: true, },
                                        async (progress: any, token: any) => {
                                            return await deployFunction(
                                                deploy_repo,
                                                currFunc,
                                                token,
                                                progress,
                                                {
                                                    username: userObj.name,
                                                    password: message.authToken,
                                                    funcName: funcNameFromFile,
                                                    version: doc['version'],
                                                    registryName: registryName,
                                                    userNamespace: userNamespace,
                                                    regionKey: currFunc.parent!.appSummary!.id!.split('.')[3],
                                                    repoNamePrefix: message.registryLocation,
                                                    comparmentId: comparment.compartment.id,
                                                    regionName: ext.api.getCurrentProfile().getRegionName(),
                                                    timeoutInSeconds: message.timeoutInSeconds,
                                                    memoryInMBs: message.memoryInMBs,
                                                    verboseLevel: message.verboseLevel
                                                },
                                            );
                                        },
                                    );
                                    reportResult(result);
                                    panel.dispose();
                                    break;
                            }
                        },
                            undefined,
                            context.subscriptions
                        );
                    }

                }
            } catch (error) {
                vscode.window.showErrorMessage(`Deploy Failed: ${error}`);
            }
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(EditConfiguration.commandName, () => {
            _appendCommandInfo(EditConfiguration.commandName, undefined);
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(EditFunctionSettings.commandName, async (item: OCIFunctionNode) => {
            _appendCommandInfo(EditFunctionSettings.commandName, item);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, EditFunctionSettings.commandName, item.resource.compartmentId!, item.resource.id));
            // TODO:  We should probably get the current function config by calling the API everytime
            // instead of using the node value
            if (!item.func.id) {
                const msg = localize("fnIdNotDefinedErrorMessage", "Function ID not defined");
                logger().error(msg);
                vscode.window.showErrorMessage(msg, { modal: true });
                return;
            }
            if (!item.func.memoryInMBs) {
                const msg = localize("memoryNotDefinedErrorMessage", "Memory of function not defined.");
                logger().error(msg);
                vscode.window.showErrorMessage(msg, { modal: true });
                return;
            }
            if (!item.func.timeoutInSeconds) {
                const msg = localize("timeoutNotDefinedErrorMessage", "Function timeout is not defined.");
                logger().error(msg);
                vscode.window.showErrorMessage(msg, { modal: true });
                return;
            }
            const webviewTitle = localize("editFunctionSettingsTitle", "Edit Function Settings");
            let panel = vscode.window.createWebviewPanel("editFunctionSettings", webviewTitle, vscode.ViewColumn.One, {
                enableScripts: true
            });
            panel.webview.html = EditFunctionSettingsGetWebview(panel.webview, context.extensionUri, item.func.timeoutInSeconds);
            panel.webview.postMessage({ command: 'current_memory', memoryInMBs: item.func.memoryInMBs });
            panel.webview.onDidReceiveMessage(async (message: { command: any; memoryInMBs: number | undefined; timeoutInSeconds: number | undefined; }) => {
                switch (message.command) {
                    case 'update_function_settings':
                        //check atleast one parameter is updated
                        if (message.memoryInMBs !== item.func.memoryInMBs || message.timeoutInSeconds !== item.func.timeoutInSeconds) {
                            await updateFunctionSettings(ext.api.getCurrentProfile().getProfileName(), item.func.id!, message.memoryInMBs!, message.timeoutInSeconds!);
                            const msg = localize("editFunctionSettingsInfoMsg", "Successfully updated function settings");
                            vscode.window.showInformationMessage(msg, { modal: false });
                            panel.dispose();
                        }
                        break;
                }
            },
                undefined,
                context.subscriptions
            );
        }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(OpenIssueInGithub.commandName, () => {
            _appendCommandInfo(OpenIssueInGithub.commandName, undefined);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, OpenIssueInGithub.commandName, undefined));
            vscode.env.openExternal(vscode.Uri.parse("https://github.com/oracle-samples/oci-vscode-toolkit/issues"));
        }),
    );
    vscode.commands.executeCommand('setContext', 'enableFunctionsViewTitleMenus', true);
}

export async function registerGenericCommands(context: vscode.ExtensionContext) {
    context.subscriptions.push(
        vscode.commands.registerCommand(ExpandCompartment.commandName,
            async function (compartmentId: string) {
                _appendCommandInfo(ExpandCompartment.commandName, compartmentId);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ExpandCompartment.commandName, compartmentId));
                await expandCompartment(compartmentId);
            })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('oci-core.listRecentActions', async (node: any) => {
            const selectedCommand = await listRecentCommands(node);
            executeUserCommand(selectedCommand);
        }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(launchWorkFlowCommand.commandName, async function (payload: any) {
            _appendCommandInfo(launchWorkFlowCommand.commandName, payload);
            await vscode.commands.executeCommand(FocusFunctionsPlugin.commandName);
            if (isPayloadValid(payload)) {
                await vscode.commands.executeCommand(FocusFunctionsPlugin.commandName); // short term solution for bug fix in theia 1.38
                await vscode.commands.executeCommand(SwitchRegion.commandName, payload.region_name);
                await launchWorkFlow(payload);
            }
            else {
                const msg = `${localize("payloadNotValidErrorMessage", "Payload is not valid. Please check payload")} ${payload}.`;
                vscode.window.showErrorMessage(msg, { modal: true });
            }
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand(
            createFullCommandName('createFile'),
            async (node: OCIFileExplorerNode) => {
                _appendCommandInfo(createFullCommandName('createFile'), node);
                const fileName = await promptForFileOrDirName();
                getArtifactHook().createTextFile(path.join(node.uriPath.fsPath, fileName!), '');
                ext.treeDataProvider.refresh(node);
            }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            createFullCommandName('createDirectory'),
            async (node: OCIFileExplorerNode) => {
                _appendCommandInfo(createFullCommandName('createDirectory'), node);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'createDirectory', undefined));
                const fileName = await promptForFileOrDirName();
                getArtifactHook().ensureDirectoryExists(path.join(node.uriPath.fsPath, fileName!));
                ext.treeDataProvider.refresh(node);
            }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            createFullCommandName('deletefileOrDir'),
            async (node: OCIFileExplorerNode) => {
                _appendCommandInfo(createFullCommandName('deletefileOrDir'), node);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'deletefileOrDir', undefined));
                try {
                    getArtifactHook().remove(node.uriPath.fsPath);
                    ext.treeDataProvider.refresh(undefined);
                } catch (error) {
                    logger().error(`${localize("unableDeleteResErrorMessage", "Unable to delete the resource at {0} due to error {1}")}`, node.uriPath.fsPath, error);
                }
            }),
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(
            createFullCommandName('openInTerminal'), async (node: OCIFileExplorerNode) => {
                _appendCommandInfo(createFullCommandName('openInTerminal'), node);
                const dirName = getDirectoryName(node.uriPath.fsPath);
                vscode.window.createTerminal({
                    cwd: dirName,
                }).show();
            }
        )
    );

    context.subscriptions.push(
        vscode.commands.registerCommand(ShowDocumentation.commandName,
            async (item: vscode.TreeItem) => {
                _appendCommandInfo(ShowDocumentation.commandName, undefined);
                MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ShowDocumentation.commandName, undefined));
                await vscode.env.openExternal(
                    vscode.Uri.parse(
                        'https://docs.oracle.com/en-us/iaas/Content/Functions/Concepts/functionsoverview.htm',
                    ),
                );
            })
    );

    context.subscriptions.push(vscode.commands.registerCommand(OCIConfigurationFunctionRootNodeItem.commandName, async (node: OCIFunctionNode) => {
        const profileName = ext.api.getCurrentProfile().getProfileName();
        const config = (await getFunction(profileName, node.id)).config;
        await registerEditConfigurationCommand(context, OCIConfigurationFunctionRootNodeItem.commandName, profileName, node, config, updateFunctionConfig);
    }));

    context.subscriptions.push(
        vscode.commands.registerCommand(ListResource.commandName, async () => {
            _appendCommandInfo(ListResource.commandName, undefined);
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, ListResource.commandName, undefined));
            let options: vscode.InputBoxOptions = {
                prompt: localize("enterCompartmentPickerMessage", "Enter compartment id to list the resources of: "),
                placeHolder: "(placeholder)"
            };
            let compartmentId: string | undefined = await vscode.window.showInputBox(options);
            await expandCompartment(compartmentId);
        }),
    );
}


export async function expandCompartment(compartmentId: string | undefined) {
    if (compartmentId) {
        const compartment = await ext.api.getCompartmentById(compartmentId);
        let profileNode: IRootNode = await ext.treeDataProvider.findTreeItem(ext.api.getCurrentProfile().getProfileName()).then(function (data) { return data!; });
        await revealTreeNode(profileNode);

        const compartmentNode = new OCICompartmentNode(compartment?.compartment, ext.api.getCurrentProfile().getProfileName(), undefined, []);
        await revealTreeNode(compartmentNode);
    }
    else {
        const msg = `${localize("notValidCompartmentMessage", "CompartmentId {0} is not valid. Please check the CompartmentId and try again"), compartmentId}`;
        vscode.window.showErrorMessage(msg, { modal: true });
    }
}

function newCreateFunctionPicker(app: OCIApplicationNode, context: vscode.ExtensionContext, dataProvider: IOCIProfileTreeDataProvider): vscode.QuickPick<vscode.QuickPickItem> {

    let visited = false;

    let picker: vscode.QuickPick<vscode.QuickPickItem> = window.createQuickPick();
    picker.items = [
        { label: OCINewFunctionType.FromTemplate.createString, detail: "" },
        { label: OCINewFunctionType.FromSample.createString, detail: "" },
        { label: OCINewFunctionType.FromCodeRepository.createString, detail: "" },
    ];
    picker.placeholder = localize("createFunctionPlaceHolder", "Select a creation method");


    picker.onDidChangeSelection(async (item: readonly vscode.QuickPickItem[]) => {
        visited = true;
        if (item[0]) {
            switch (item[0].label) {
                case OCINewFunctionType.FromTemplate.createString:
                    handleResult(await createFunctionFromTemplate(app, context, dataProvider));
                    break;
                case OCINewFunctionType.FromSample.createString:
                    handleResult(await createFunctionFromSample(app, dataProvider));
                    break;
                case OCINewFunctionType.FromCodeRepository.createString:
                    handleResult(await createFunctionFromCodeRepository(app, context, dataProvider));
                    break;
            }

        }
    });

    picker.onDidHide(() => {
        if (!visited) {
            const noDialogOption = localize("noDialogOption", "No");
            const closeCreateFunctionInfoMsg = localize("closeCreateFunctionInfoMsg", "Do you wish to close create function menu?");
            vscode.window.showInformationMessage(closeCreateFunctionInfoMsg, { modal: true }, noDialogOption)
                .then(answer => {
                    if (answer === noDialogOption) {
                        newCreateFunctionPicker(app, context, dataProvider).show();
                    } else {
                        picker.dispose();
                    }
                });
        }
    });

    return picker;
}
export async function promptForFileOrDirName(
): Promise<string | undefined> {
    const fileName: vscode.InputBoxOptions = {
        prompt: '',
        ignoreFocusOut: true,
    };
    return vscode.window.showInputBox(fileName);
}
