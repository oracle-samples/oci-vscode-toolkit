/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { OCINewFunctionNode } from "../../tree/nodes/oci-new-function-node";
import * as vscode from 'vscode';
import { hasFailed, IActionResult, isCanceled, newCancellation, newError, newSuccess } from "../../../utils/actionResult";
import { createOCIFunction } from "../../../api/function";
import { ext } from "../../../extensionVars";
import { OciError } from "oci-common/lib/error";
import { OCIFunctionNode } from "../../tree/nodes/oci-function-node";
import { FnClientManager } from "../../../common/shell/fn-client-manager";
import { DockerManager } from "../../../common/shell/docker-manager";
import { Repository } from "../../../git";
import * as nls from 'vscode-nls';
import { METRIC_INVOCATION, METRIC_FAILURE, METRIC_SUCCESS } from "oci-ide-plugin-base/dist/monitoring/monitoring";
import { Service } from "oci-ide-plugin-base/dist/monitoring/service";
import { MONITOR } from "../../../common/monitor";

interface DeployConfig {
    username: string,
    password: string,
    funcName: string,
    version: string,
    registryName: string,
    userNamespace: string,
    regionKey: string,
    repoNamePrefix: string,
    comparmentId: string,
    regionName: string,
    timeoutInSeconds: number,
    memoryInMBs: number,
    verboseLevel: string
}

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

const deployChannel = vscode.window.createOutputChannel('Functions deployment');

export async function deployFunction(
    deploy_repo: Repository,
    fn: OCINewFunctionNode | OCIFunctionNode,
    cancellationToken: vscode.CancellationToken,
    progress: vscode.Progress<{ message?: string; increment?: number; }>,
    deployConfig: DeployConfig
): Promise<IActionResult> {

    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_INVOCATION, 'deployFunction', fn.resource.compartmentId!));
    const dockerManager = new DockerManager(deployChannel);
    const dockerInstalled = await dockerManager.isInstalled();
    if (!dockerInstalled) {
        const dockerNotInstalledInfoMsg = localize("dockerNotInstalledInfoMsg", 'Docker is not installed or not running. Please install or start docker and try again');
        return newError(
            dockerNotInstalledInfoMsg,
        );
    }
    if (deployConfig.verboseLevel) {
        deployChannel.show();
    }
    const loggingInInfoMsg = localize("loggingInInfoMsg", 'Logging in to');

    progress.report({
        message: `${loggingInInfoMsg}  ${deployConfig.registryName}...`,
    });
    const loginResult =
        await dockerManager.login(
            deployConfig.username,
            deployConfig.password,
            deployConfig.userNamespace,
            deployConfig.regionKey
        );
    if (!loginResult) {
        const dockerLoginFailedInfoMsg = localize("dockerLoginFailedInfoMsg", 'Failed to login to the docker registry');
        return newError(dockerLoginFailedInfoMsg);
    }

    if (cancellationToken.isCancellationRequested) {
        return newCancellation();
    }

    let fncli = new FnClientManager(
        deployConfig.regionName,
        deployConfig.regionKey,
        deployConfig.repoNamePrefix,
        deployConfig.comparmentId,
        deployConfig.registryName,
        deployChannel
    );
    const createContextInfoMsg = localize("createContextInfoMsg", 'Creating new fn context');
    progress.report({
        message: `${createContextInfoMsg}...`,
    });
    const fnCliInstalled = await fncli.checkFnClient();
    if (!fnCliInstalled) {
        const fnClientNotInstalledInfoMsg = localize("fnClientNotInstalledInfoMsg", 'fn cli is not installed. Please install fn cli');
        return newError(
            fnClientNotInstalledInfoMsg
        );
    }
    var isEnvSetup = await fncli.setupEnv();
    if (!isEnvSetup) {
        const envFailedInfoMsg = localize("envFailedInfoMsg", 'Creation of env failed for fn client');
        return newError(
            envFailedInfoMsg
        );
    }
    const buildImageInfoMsg = localize("buildImageInfoMsg", 'Building Image');
    progress.report({
        message: `${buildImageInfoMsg}...`,
    });
    const builRes = await fncli.buildDockerImage(deploy_repo.rootUri.fsPath);
    if (!builRes) {
        const dockerBuildFailedInfoMsg = localize("dockerBuildFailedInfoMsg", 'Failed to build docker image');
        return newError(dockerBuildFailedInfoMsg);
    }
    const pushImageInfoMsg = localize("pushImageInfoMsg", 'Pushing image to registry');
    progress.report({
        message: `${pushImageInfoMsg}...`,
    });

    // <region-key>.ocir.io/<tenancy-namespace>/<repo-name>/<image-name>:<tag>
    const registryImageName = `${deployConfig.regionKey}.ocir.io/${deployConfig.registryName}/${deployConfig.repoNamePrefix}/${deployConfig.funcName}:${deployConfig.version}`;
    const pushImageChannelMessage = localize("pushImageChannelMessage", 'Pushing image');
    progress.report({ message: `${pushImageChannelMessage} ${registryImageName}...` });
    const pushResult = await dockerManager.push(registryImageName);
    if (!pushResult) {
        const imagePushFailedMessage = localize("imagePushFailedMessage", 'Failed to push the image');
        return newError(imagePushFailedMessage);
    }
    if (cancellationToken.isCancellationRequested) {
        return newCancellation();
    }
    const deployImageChannelMessage = localize("deployImageChannelMessage", 'Deploying image');
    progress.report({
        message: `${deployImageChannelMessage}...`,
    });
    if (fn instanceof OCINewFunctionNode) {
        try {
            await createOCIFunction(
                ext.api.getCurrentProfile().getProfileName(),
                deployConfig.funcName!,
                fn.parent?.appSummary.id!,
                registryImageName, //phx.ocir.io/ten/functions/function:0.0.1
                deployConfig.memoryInMBs,
                deployConfig.timeoutInSeconds,
            );
        } catch (err) {
            const ociError = err as OciError;
            const failedCreateErrorMessage = localize("failedCreateErrorMessage", 'Failed to create the function');
            return newError(
                `${failedCreateErrorMessage}.\n${ociError.message}`,
            );
        }
    } else {
        let deployed = await fncli.deploy(fn.parent?.appSummary.displayName!, deploy_repo.rootUri.fsPath);
        if (!deployed) {
            const failedDeployErrorMessage = localize("failedDeployErrorMessage", 'Failed to deploy function');
            MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_FAILURE, 'deployFunction', fn.resource.compartmentId!));
            return newError(failedDeployErrorMessage);
        }
    }
    var isEnvCleared = await fncli.clearEnv();
    if (!isEnvCleared) {
        const clearFnEnvMessage = localize("clearFnEnvMessage", 'Clearing of fn cli env failed');
        return newError(
            clearFnEnvMessage,
        );
    }
    MONITOR.pushCustomMetric(Service.prepareMetricData(METRIC_SUCCESS, 'deployFunction', fn.resource.compartmentId!));
    return newSuccess();
}

export async function reportResult(result: IActionResult) {
    if (isCanceled(result)) {
        const deployCancelledMessage = localize("deployCancelledMessage", 'Deployment was cancelled.');
        await vscode.window.showWarningMessage(
            deployCancelledMessage, { modal: false }
        );
    } else if (hasFailed(result)) {
        await vscode.window.showErrorMessage(result.result, { modal: false });
    } else {
        const deploySuccessMessage = localize("deploySuccessMessage", 'Function is deployed.');
        await vscode.window.showInformationMessage(
            deploySuccessMessage, { modal: false }
        );
    }
}
