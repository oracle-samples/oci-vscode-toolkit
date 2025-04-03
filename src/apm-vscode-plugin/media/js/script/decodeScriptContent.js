/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

$(document).ready(function () {
    var script_content_tag = document.getElementById("script_content_decode_js");
    const decodedScriptContent = atob(script_content_tag.text);
    document.getElementById('file-text-input').value = JSON.parse(decodedScriptContent, null, '\t');
});
