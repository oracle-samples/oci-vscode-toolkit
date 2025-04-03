/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import { execCmd, logToOutput } from '../../common/shell/exec-shell-commands';

export class FnClientManager {
    private readonly compartment_id: string;
    private readonly registry: string;
    private readonly region_name: string;
    private readonly repo_name_prefix: string;
    private readonly region_key: string;
    private readonly temp_context: string;
    private readonly outputChannel: vscode.OutputChannel;

    constructor(region_name: string, region_key: string, repo_name_prefix: string, compartment_id: string, registry: string, outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
        this.compartment_id = compartment_id;
        this.region_name = region_name;
        this.repo_name_prefix = repo_name_prefix;
        this.region_key = region_key;
        this.registry = registry;
        this.temp_context = `${this.registry}-temp`;
    }
    async deploy(appName: string, buildContextFolder: string): Promise<boolean> {
        return await execCmd(`fn deploy -v --app ${appName} -w ${buildContextFolder}`, logToOutput, this.outputChannel);
    }

    public async setupEnv(): Promise<boolean> {
        if (!await this.clearEnv()) { return false; }
        if (!await execCmd(`fn create context ${this.temp_context} --provider oracle`, logToOutput, this.outputChannel)) { return false; }
        if (!await execCmd(`fn use context ${this.temp_context}`, logToOutput, this.outputChannel)) { return false; };
        if (!await execCmd(`fn update context oracle.compartment-id ${this.compartment_id}`, logToOutput, this.outputChannel)) { return false; };
        if (!await execCmd(`fn update context api-url https://functions.${this.region_name}.oraclecloud.com`, logToOutput, this.outputChannel)) { return false; };
        if (!await execCmd(`fn update context registry ${this.region_key}.ocir.io/${this.registry}/${this.repo_name_prefix}`, logToOutput, this.outputChannel)) { return false; };
        return true;
    }

    public async clearEnv(): Promise<boolean> {
        await execCmd(`fn use context default`, logToOutput, this.outputChannel);
        await execCmd(`fn delete context ${this.temp_context}`, logToOutput, this.outputChannel);
        return true;
    }

    public async checkFnClient(): Promise<boolean> {
        return await execCmd('fn help', logToOutput, this.outputChannel);
    }

    public async buildDockerImage(
        buildContextFolder: string,
    ): Promise<boolean> {
        const buildCmd = `fn build --no-cache -w ${buildContextFolder}`;
        const result = await execCmd(buildCmd, logToOutput, this.outputChannel);
        return result;
    }
}
