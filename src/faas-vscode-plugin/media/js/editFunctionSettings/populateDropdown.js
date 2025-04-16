/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

//populate Dropdown, select the current value from the dropdown
window.addEventListener('message', event => {
  const message = event.data; // The json data that the extension sent
  switch (message.command) {
      case 'current_memory':
          var select_obj  = document.getElementById("memory-input");
          var opt = document.createElement("option");
          // TODO: Dont use hardcoded list for dropdown:
          // 1. Check if any API to get this list of values form functions team
          // 2. Use ENUM
          var data = [
            128, 256, 512, 1024, 2048
          ];
          for (var i = 0; i < data.length; i++) {
            var opt = document.createElement("option");
            opt.value = data[i];
            opt.text = data[i];
            if(data[i] === message.memoryInMBs){
              opt.selected = true;
            }
            select_obj.appendChild(opt);
          }
          break;
        default:
          break;

  }
});
