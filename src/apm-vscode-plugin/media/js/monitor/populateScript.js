/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

$(document).ready(function () {
    var scriptId = document.getElementById("script-id-sel");
    var select_obj = document.getElementById("script-id-input");
    var opt = document.createElement("option");
    var script_tag = document.getElementById("script_drop_down_js");
    var stringified = JSON.stringify(script_tag.text);
    var parsed = JSON.parse(JSON.parse(stringified));

    var opt = document.createElement("option");
    opt.value = "-1";
    opt.text = "Select a script";
    opt.disabled = true;
    opt.selected = true;
    select_obj?.appendChild(opt);

    for (var element in parsed) {
        var opt = document.createElement("option");
        var s = parsed[element];
        opt.value = s["scriptId"];
        opt.text = s["scriptName"];
        if (scriptId && scriptId.value !== '' && s["scriptId"] === scriptId.value) {
            opt.selected = true;
            select_obj.options[select_obj.options.selectedIndex].selected = false;
        }
        select_obj?.appendChild(opt);
    }
});
