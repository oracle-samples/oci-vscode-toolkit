/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

$(document).ready(function () {
    let vpIds = document.getElementById("vp-id-sel");
    var select_obj = document.getElementById("vantage-point-input");
    var opt = document.createElement("option");
    var script_tag = document.getElementById("vp_drop_down_js");
    var stringified = JSON.stringify(script_tag.text);
    var parsed = JSON.parse(JSON.parse(stringified));

    var opt = document.createElement("option");
    opt.value = "-1";
    opt.text = "Select vantage points";
    opt.disabled = true;
    opt.selected = true;
    select_obj?.appendChild(opt);

    var edit = false;
    for (var element in parsed) {
        var opt = document.createElement("option");
        var v = parsed[element];
        opt.value = v["name"];
        opt.text = v["displayName"];
        if (vpIds && vpIds.value !== '' && vpIds.value.indexOf(v["name"]) >= 0) {
            opt.selected = true;
            edit = true;
        }
        select_obj?.appendChild(opt);
    }
    if (edit) {
        select_obj.options[select_obj.options.selectedIndex].selected = false;
    }
});
