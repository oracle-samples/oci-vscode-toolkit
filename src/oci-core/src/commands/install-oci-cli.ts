/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as nls from 'vscode-nls';
import * as cp from 'child_process';
import { ExtensionContext, window } from 'vscode';
import os = require('os');
import { ensureDoesNotExists } from '../common/fileSystem/filesystem';
const localize: nls.LocalizeFunc = nls.loadMessageBundle();
const venvName='oci-toolkit';
let globalStateContext:ExtensionContext;
export async function installOCICLI() {

    cp.exec(`source ${venvName}/bin/activate || ${venvName}/Scripts/activate`, (error: cp.ExecException | null) => {
        if (error) {
            const installOCICLIAction = localize('installOCICLILabel', 'Install OCI CLI');
            const cancelAction = localize('cancel', 'Cancel');
            const confirmationMsg = localize('installOCICLIConfirmationMsg', 'Do you want to install OCI CLI as a part of toolkit?');
            window.showInformationMessage(confirmationMsg, installOCICLIAction, cancelAction).then(async answer => {
            if (answer === installOCICLIAction) {
            if (os.platform() == 'darwin' || os.platform() == 'linux') {
                executeTerminalCommandInMac(false);
            }
            else if (os.platform() == 'win32') {
                executeTerminalCommandInWin32(false);
            }
        }});
        }
        else{
            cp.exec('oci --version', (error: cp.ExecException | null) => {
            if (error) {
            const installOCICLIAction = localize('installOCICLILabel', 'Install OCI CLI');
            const cancelAction = localize('cancel', 'Cancel');
            const confirmationMsg = localize('installOCICLIConfirmationMsg', 'Do you want to install OCI CLI as a part of toolkit?');
            window.showInformationMessage(confirmationMsg, installOCICLIAction, cancelAction).then(async answer => {
            if (answer === installOCICLIAction) {
                if (os.platform() == 'darwin' || os.platform() == 'linux') {
                    executeTerminalCommandInMac(true);}
                else if (os.platform() == 'win32') {
                    executeTerminalCommandInWin32(true);
                }
            }});
            }
        });
        }
    });
}

function executeTerminalCommandInMac(venvExists:boolean)
{ 
    const terminal = window.createTerminal('OCI CLI');
    terminal.show();
    if(globalStateContext && globalStateContext.globalState.get('OCI_CLI_AUTO_PROMPT')=='True')
    {
        terminal.sendText(`export OCI_CLI_AUTO_PROMPT=True`);  
    }
    if(venvExists)
    {
        terminal.sendText(`python3 -m venv ${venvName}`);
    }
    terminal.sendText(`source ${venvName}/bin/activate`);
    terminal.sendText(`bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"`);     
}

function executeTerminalCommandInWin32(venvExists:boolean)
{
    const terminal = window.createTerminal('OCI CLI');
    const homeDir = os.homedir();
    const ociPath = new String(homeDir).concat("\\bin\\oci\.exe");
    const ociCLIScriptsPath = new String(homeDir).concat("\\bin\\oci-cli-scripts");
    const oracleCLIPath = new String(homeDir).concat("\\lib\\oracle-cli");

    ensureDoesNotExists(ociPath);
    ensureDoesNotExists(ociCLIScriptsPath);
    ensureDoesNotExists(oracleCLIPath);
    if(globalStateContext && globalStateContext.globalState.get('OCI_CLI_AUTO_PROMPT')=='True')
    {
        terminal.sendText(`export OCI_CLI_AUTO_PROMPT=True`);  
    }
    if(venvExists)
    {
        terminal.sendText(`python3 -m venv ${venvName}`);
    }
    terminal.sendText(`${venvName}/Scripts/activate`);
    terminal.sendText(`(New-Object System.Net.WebClient).DownloadString('https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.ps1') > install.ps1`);
    terminal.sendText(`powershell -NoProfile -ExecutionPolicy Bypass -Command ./install.ps1 -AcceptAllDefaults`);
    cp.execFile(`${homeDir}\bin\oci`);
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
