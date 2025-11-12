/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

$(document).ready(function () {
    var script_content_tag = document.getElementById("script_content_decode_js");
    var decodedScriptContent;
    const scriptContentType = script_content_tag.dataset.type;
    switch (scriptContentType) {
        case "SIDE":
            decodedScriptContent = JSON.parse(atob(script_content_tag.dataset.content, null, '\t'));
            document.getElementById('file-text-input').value = JSON.parse(decodedScriptContent, null, '\t');
            break;
        case "JS":
        case "PLAYWRIGHT_TS":
            decodedScriptContent = decodeURIComponent(script_content_tag.dataset.content);
            document.getElementById('file-text-input').value = decodedScriptContent;
            break;
        case "UNKNOWN_VALUE":
            vscode.window.showErrorMessage(localize('incorrectScriptContentType', 'Incorrect script content type'));
            return newCancellation();
    }

});
