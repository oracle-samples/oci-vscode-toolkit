/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

function saveAsFile(filename, scriptContentType, dataObjToWrite) {
    try {
        var mimeType;
        var content;
        switch (scriptContentType) {
            case "JSON": // monitor template
            case "SIDE": // SIDE script
                mimeType = "text/json";
                content = JSON.stringify(dataObjToWrite, null, '\t');
                break;
            case "JS": // JS script
            case "PLAYWRIGHT_TS": // TS script
                mimeType = "text/plain";
                content = dataObjToWrite;
                break;
            case "UNKNOWN_VALUE":
                vscode.window.showErrorMessage(localize('incorrectScriptContentType', 'Incorrect script content type'));
                return newCancellation();
        }
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement("a");

        link.download = filename;
        link.href = window.URL.createObjectURL(blob);
        link.dataset.downloadurl = [mimeType, link.download, link.href].join(":");

        const evt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });

        link.dispatchEvent(evt);
        link.remove();
    } catch (error) {
        return false;
    }
    return true;
}