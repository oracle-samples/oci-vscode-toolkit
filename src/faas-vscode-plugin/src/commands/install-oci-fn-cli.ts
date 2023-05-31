/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as nls from 'vscode-nls';
import { window } from 'vscode';
import * as cp from 'child_process';
import os = require('os');
const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export async function installFunctionCLI() {
    cp.exec('fn version', (error: cp.ExecException | null) => {
        if (error) {
            const installOCIFNCLIAction = localize('installOCIFNCLILabel', 'Install OCI Function CLI');
            const cancelAction = localize('cancel', 'Cancel');
            const confirmationMsg = localize('installOCIFNCLIConfirmationMsg', 'Do you want to install OCI Function CLI as a part of plugin?');
            window.showInformationMessage(confirmationMsg, installOCIFNCLIAction, cancelAction).then(async answer => {
                if (answer === installOCIFNCLIAction) {
                    const terminal = window.createTerminal('OCI FN CLI');
                    if (os.platform() == 'darwin' || os.platform() == 'linux') {
                        terminal.show();
                        terminal.sendText(`bash -c "$(curl -LSs https://raw.githubusercontent.com/fnproject/cli/master/install | sh)"`);
                    }
                    else if (os.platform() == 'win32') {
                        const fnclicmd = 'bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)" && brew update && brew install fn';
                        terminal.show();
                        terminal.sendText(fnclicmd);
                    }
                }
            });
        }
    });
}
