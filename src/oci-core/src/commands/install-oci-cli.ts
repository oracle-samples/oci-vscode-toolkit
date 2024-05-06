/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as nls from 'vscode-nls';
import * as cp from 'child_process';
import { ExtensionContext, MessageOptions, Terminal, window } from 'vscode';
import os = require('os');
import path = require('path');
import { ensureDoesNotExists } from '../common/fileSystem/filesystem';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
const venvName=path.join(os.homedir(),'oci-toolkit');
let globalStateContext:ExtensionContext;

export async function installOCICLI() {
    if (os.platform() == 'darwin' || os.platform() == 'linux') {
        cp.exec(`source ${venvName}/bin/activate`, (error: cp.ExecException | null) => {
            if (error) { 
                executeTerminalCommandInMac(false);
            }
            else{
                cp.exec('oci --version', (error: cp.ExecException | null) => {
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
            else{
                cp.exec('oci --version', (error: cp.ExecException | null) => {
                if (error) {
                    executeTerminalCommandInWin32(true);
                }
            });
            }
        });
    }
}

function executeTerminalCommandInMac(venvExists:boolean)
{ 
    const { confirmationMsg, installationMessage, installOCICLIAction }: { confirmationMsg: string; installationMessage: MessageOptions; installOCICLIAction: string; } = installationDialogueMessages();
    window.showInformationMessage(confirmationMsg, installationMessage, installOCICLIAction).then(async answer => {
    if (answer === installOCICLIAction) {
        const terminal = window.createTerminal('OCI CLI');
        showTerminal(terminal);
        if(globalStateContext && globalStateContext.globalState.get('OCI_CLI_AUTO_PROMPT')=='True')
        {
            executeCommandInTerminal(terminal)(`export OCI_CLI_AUTO_PROMPT=True`);  
        }
        if(!venvExists)
        {
            executeCommandInTerminal(terminal)(`python3 -m venv ${venvName}`);
        }
        executeCommandInTerminal(terminal)(`source ${venvName}/bin/activate`);
        executeCommandInTerminal(terminal)(`bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"`);     
    }});
}

function executeTerminalCommandInWin32(venvExists:boolean)
{
    const { confirmationMsg, installationMessage, installOCICLIAction }: { confirmationMsg: string; installationMessage: MessageOptions; installOCICLIAction: string; } = installationDialogueMessages();
    window.showInformationMessage(confirmationMsg, installationMessage, installOCICLIAction).then(async answer => {
    if (answer === installOCICLIAction) {
        const terminal = window.createTerminal('OCI CLI');
        showTerminal(terminal);
        const { ociPath, ociCLIScriptsPath, oracleCLIPath, homeDir } = constructCLIPathsInWin32();
        ensureDoesNotExists(ociPath);
        ensureDoesNotExists(ociCLIScriptsPath);
        ensureDoesNotExists(oracleCLIPath);
        
        if(globalStateContext && globalStateContext.globalState.get('OCI_CLI_AUTO_PROMPT')=='True')
        {
            executeCommandInTerminal(terminal)(`export OCI_CLI_AUTO_PROMPT=True`);  
        }
        if(!venvExists)
        {
            executeCommandInTerminal(terminal)(`python -m venv ${venvName}`);
        }
        const venvactivatecmd=path.join(venvName,"Scripts","activate");
        executeCommandInTerminal(terminal)(venvactivatecmd);
        executeCommandInTerminal(terminal)(`(New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.ps1') > install.ps1`);
        executeCommandInTerminal(terminal)(`powershell -NoProfile -ExecutionPolicy Bypass -Command ./install.ps1 -AcceptAllDefaults`);
        cp.execFile(`${homeDir}\\bin\\oci`);
    }});
}

export async function enableInteractiveCLI(context:ExtensionContext)
{   
    if(context.globalState.get('OCI_CLI_AUTO_PROMPT')=='True')
    {
    await context.globalState.update('OCI_CLI_AUTO_PROMPT', 'False');
    window.showInformationMessage(localize('disableinteractivecliMsg',' Interactive CLI is disabled'));
    }
    else
    {
    await context.globalState.update('OCI_CLI_AUTO_PROMPT', 'True');
    window.showInformationMessage(localize('enableinteractivecliMsg',' Interactive CLI is enabled'));
    }
    globalStateContext=context;
}

function installationDialogueMessages() {
    const installOCICLIAction = localize('installOCICLILabel', 'Install OCI CLI');
    const installationDetails = localize('installationDetails', 'This will install the OCI CLI in a virtual environment and will not interfere with any existing OCI CLI installations on your machine.');
    const installationMessage: MessageOptions = { detail: installationDetails, modal: true };
    const confirmationMsg = localize('installOCICLIConfirmationMsg', 'Do you want to install OCI CLI as a part of toolkit?');
    return { confirmationMsg, installationMessage, installOCICLIAction };
}

function constructCLIPathsInWin32() {
    const homeDir = os.homedir();
    const ociPath = concat(homeDir)("\\bin\\oci.exe");
    const ociCLIScriptsPath = concat(homeDir)("\\bin\\oci-cli-scripts");
    const oracleCLIPath = concat(homeDir)("\\lib\\oracle-cli");
    return { ociPath, ociCLIScriptsPath, oracleCLIPath, homeDir };
}

function executeCommandInTerminal(terminal: Terminal) {
    return terminal.sendText;
}

function showTerminal(terminal: Terminal) {
    terminal.show();
}

function concat(directory: string) {
    return new String(directory).concat;
}
