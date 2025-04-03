/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as cp from 'child_process';
import * as vscode from 'vscode';

export function logToOutput(data: string, outputChannel?: vscode.OutputChannel) {
    if (data.toString().trim() === '.') {
        if (outputChannel) {
            outputChannel.append(data);
        }
        else {
            console.log(data);
        }

    } else {
        if (outputChannel) {
            outputChannel.appendLine(data);
        } else {
            console.log(data);
        }
    }
}

export async function execCmd(cmd: string, logFunction: (data: string, channel?: vscode.OutputChannel) => void, outputChannel?: vscode.OutputChannel, timeOut: number = 60 * 1000 * 10): Promise<boolean> {
    logFunction(`Executing command: ${cmd}`, outputChannel);
    return await new Promise((resolve, reject) => {
        const proc: cp.ChildProcess = cp.exec(cmd, (error: cp.ExecException | null) => {
            if (error) {
                logFunction(error.message, outputChannel);
                reject(error);
            }
            resolve(true);
        });

        let timer = setTimeout(() => proc.kill(), timeOut);

        proc.on('exit', (code, signal) => {
            clearTimeout(timer);
            logFunction(`exec ${cmd} on exit code: ${code} signal: ${signal}`, outputChannel);
            if (code !== 0) {
                resolve(false);
            }
            resolve(true);
        });

        proc.on('close', (code: number, args: any[]) => {
            clearTimeout(timer);
            logFunction(`exec ${cmd} on close code: ${code} args: ${args}`, outputChannel);
            if (code !== 0) {
                resolve(false);
            }
            resolve(true);
        });

        proc.stdout?.on('data', (data: string) => {
            logFunction(data, outputChannel);
        });

        proc.stderr?.on('data', (err: string) => {
            logFunction(err, outputChannel);
        });

    });
}
