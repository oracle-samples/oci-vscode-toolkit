/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function() {
    var select_obj  = document.getElementById("memory-input");
    var opt = document.createElement("option");
    var data = [
        128, 256, 512, 1024, 2048
      ];
    for (var i = 0; i < data.length; i++) {
        var opt = document.createElement("option");
        opt.value = data[i];
        opt.text = data[i];
        if(data[i] === 128){
            opt.selected = true;
    }
    select_obj.appendChild(opt);
    }

});
