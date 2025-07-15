/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

$(document).ready(function () {
    var select_obj = document.getElementById("dropdown-file-input");
    var script_tag = document.getElementById("dropdown_js");
    var fileList = script_tag.text;
    var parsedFiles = JSON.parse(fileList);

    for (var i in parsedFiles) {
        var opt = document.createElement("option");
        opt.value = parsedFiles[i];
        opt.text = parsedFiles[i];
        if (opt.text === 'All') {
            opt.selected = true;
        }
        select_obj?.appendChild(opt);
    }
    // Dispatch an event to notify that population is done
    window.dispatchEvent(new Event('dropdownReady'));
});
