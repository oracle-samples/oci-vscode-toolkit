/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

(function () {
    const vscode = acquireVsCodeApi();

    function collectEnvironmentVariables() {
        const table = document.getElementById('environment-variables-table');
        const rowCount = table.rows.length;

        let variables = {};
        for (let row = 0; row < rowCount; row++) {
            const key = document.getElementById(`environmentVariableKey[${row}]`).value.trim();
            const value = document.getElementById(`environmentVariableValue[${row}]`).value;

            if (key) {
                variables[key] = value;
            }
        }

        return variables;
    }

    const submitButton = document.getElementById("button-run-job");
    submitButton.addEventListener("click", (e) => {
        e.preventDefault();

        vscode.postMessage({
            command: 'runJob',
            environmentVariables: collectEnvironmentVariables(),
            commandLineArguments: document.getElementById('commandLineArguments').value,
            maxRuntime: document.getElementById('maxRuntime').value,
        });
    });

    const addEnvironmentVariableButton = document.getElementById("add-environment-variable");
    addEnvironmentVariableButton.addEventListener("click", (e) => {
        e.preventDefault();

        const table = document.getElementById('environment-variables-table');
        const rowCountBeforeInsertingNewRow = table.rows.length;
        const row = table.insertRow(rowCountBeforeInsertingNewRow);
        const firstRowHtml = document.getElementById("environment-variables-first-row").innerHTML;
        row.innerHTML = firstRowHtml.replaceAll("[0]", `[${rowCountBeforeInsertingNewRow}]`);
    });
}());       
