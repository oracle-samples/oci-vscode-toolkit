/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function () {
    const vscode = acquireVsCodeApi();
    const decodedScriptContent = document.getElementById('file-text-input').value;
    const fileName = document.getElementById('file-name').value;
    var script_content_tag = document.getElementById("script_js");
    const scriptContentType = script_content_tag.dataset.type;
    var status;
    switch (scriptContentType) {
        case "SIDE":
            let decodedAndParsedContent = JSON.parse(JSON.stringify(JSON.parse(decodedScriptContent), null, '\t'));
            status = saveAsFile(fileName, scriptContentType, decodedAndParsedContent);
            break;
        case "JS":
        case "PLAYWRIGHT_TS":
            status = saveAsFile(fileName, scriptContentType, decodedScriptContent);
            break;
        case "UNKNOWN_VALUE":
            vscode.window.showErrorMessage(localize('incorrectScriptContentType', 'Incorrect script content type'));
            return newCancellation();
    }

    // Post a message to the extension when 'Get Execution Results' button is clicked
    vscode.postMessage({
        command: 'download_complete',
        status: status
    });
});
