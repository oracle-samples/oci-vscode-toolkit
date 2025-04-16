/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as nls from 'vscode-nls';
import { MessageOptions, Terminal, window } from 'vscode';
import * as cp from 'child_process';
import * as os from 'os';
import * as path from 'path';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
const venvName = path.join(os.homedir(), 'oci-toolkit');

export async function installFunctionCLI() {
    if (os.platform() == 'darwin' || os.platform() == 'linux') {
        cp.exec(`source ${venvName}/bin/activate`, (error: cp.ExecException | null) => {
            if (error) {
                executeTerminalCommandInMac(false);
            }
            else {
                cp.exec('fn version', (error: cp.ExecException | null) => {
                    if (error) {
                        executeTerminalCommandInMac(true);
                    }
                });
            }
        });
    }
    else if (os.platform() == 'win32') {
        cp.exec(`${venvName}/Scripts/activate`, (error: cp.ExecException | null) => {
            if (error) {
                executeTerminalCommandInWin32(false);
            }
            else {
                cp.exec('fn version', (error: cp.ExecException | null) => {
                    if (error) {
                        executeTerminalCommandInWin32(true);
                    }
                });
            }
        });
    }
}

function executeTerminalCommandInMac(venvExists: boolean) {
    const { confirmationMsg, installationMessage, installOCIFNCLIAction }: { confirmationMsg: string; installationMessage: MessageOptions; installOCIFNCLIAction: string; } = installationDialogueMessages();
    window.showInformationMessage(confirmationMsg, installationMessage, installOCIFNCLIAction).then(async answer => {
        if (answer === installOCIFNCLIAction) {
            const terminal = window.createTerminal('OCI Function CLI');
            showTerminal(terminal);
            if (!venvExists) {
                executeCommandInTerminal(terminal)(`python3 -m venv ${venvName}`);
            }
            executeCommandInTerminal(terminal)(`source ${venvName}/bin/activate`);
            executeCommandInTerminal(terminal)(`bash -c "$(curl -LSs https://raw.githubusercontent.com/fnproject/cli/master/install | sh)"`);

        }
    });
}

function executeTerminalCommandInWin32(venvExists: boolean) {
    const { confirmationMsg, installationMessage, installOCIFNCLIAction }: { confirmationMsg: string; installationMessage: MessageOptions; installOCIFNCLIAction: string; } = installationDialogueMessages();
    window.showInformationMessage(confirmationMsg, installationMessage, installOCIFNCLIAction).then(async answer => {
        if (answer === installOCIFNCLIAction) {
            const terminal = window.createTerminal('OCI Function CLI');
            const fnclipath = os.homedir();
            showTerminal(terminal);
            const fnclicmd = ('curl https://github.com/fnproject/cli/releases/download/0.6.25/fn.exe -o ').concat(path.join(fnclipath, 'fn.exe'));
            executeCommandInTerminal(terminal)(fnclicmd);
            executeCommandInTerminal(terminal)('cmd.exe');
            if (!venvExists) {
                executeCommandInTerminal(terminal)(`python -m venv ${venvName}`);
            }
            const venvactivatecmd = path.join(venvName, "Scripts", "activate");
            executeCommandInTerminal(terminal)(venvactivatecmd);
            executeCommandInTerminal(terminal)('mkdir C:\\fn');
            executeCommandInTerminal(terminal)('xcopy '.concat(path.join(fnclipath, 'fn.exe')).concat(' C:\\fn'));
            executeCommandInTerminal(terminal)('PATH %PATH%;C:\\fn');
        }
    });
}

function executeCommandInTerminal(terminal: Terminal) {
    return terminal.sendText;
}

function showTerminal(terminal: Terminal) {
    terminal.show();
}

function installationDialogueMessages() {
    const installOCIFNCLIAction = localize('installOCIFNCLILabel', 'Install OCI Function CLI');
    const installationDetails = localize('installationFnCLIDetails', 'This will install the OCI Function CLI in a virtual environment and will not interfere with any existing OCI Function CLI installations on your machine.');
    const installationMessage: MessageOptions = { detail: installationDetails, modal: true };
    const confirmationMsg = localize('installOCIFNCLIConfirmationMsg', 'Do you want to install OCI Function CLI as a part of plugin?');
    return { confirmationMsg, installationMessage, installOCIFNCLIAction };
}