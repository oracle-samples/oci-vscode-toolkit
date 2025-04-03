/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import * as cp from 'child_process';

import { execCmd, logToOutput } from './exec-shell-commands';

export class DockerManager {
    private readonly outputChannel: vscode.OutputChannel;

    constructor(outputChannel: vscode.OutputChannel) {
        this.outputChannel = outputChannel;
    }

    public async isInstalled(): Promise<boolean> {
        return await execCmd('docker version', logToOutput, this.outputChannel);
    }

    public async login(
        username: string,
        password: string,
        registryName: string,
        regionKey: string
    ): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const loginCmd = `docker login -u  ${registryName}/${username} ${regionKey}.ocir.io --password-stdin`;
            let childProcess = cp.exec(loginCmd, (err, stdout, stderr) => {
                this.outputChannel.appendLine(loginCmd);
                this.outputChannel.append(stdout);
                this.outputChannel.append(stderr);

                if (err) {
                    console.error(err);
                    reject(false);
                } else if (stderr) {
                    console.error(stderr);
                    reject(false);
                } else {
                    resolve(true);
                }
            });
            if (childProcess.stdin) {
                childProcess.stdin.write(password);
                childProcess.stdin.end();
            }
            childProcess.on('exit', (code) => {
                if (code !== 0) {
                    resolve(false);
                }
                resolve(true);
            });

        });
    }

    public async push(imageName: string): Promise<boolean> {
        const pushCmd = `docker push ${imageName}`;
        return execCmd(pushCmd, logToOutput, this.outputChannel);
    }

    public async tag(
        existingImageName: string,
        newImageName: string,
    ): Promise<boolean> {
        const tagCmd = `docker tag ${existingImageName} ${newImageName}`;
        return execCmd(tagCmd, logToOutput, this.outputChannel);
    }
}
