/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function() {
    $( "#form_update_function" ).validate({
      rules: {
        timeout_input: {
          required: true,
          range: [5, 300]
        }
      },
      submitHandler: function() {
        const vscode = acquireVsCodeApi();
        var select_obj = document.getElementById('memory-input');
        var memoryInMBs_new = select_obj.options[select_obj.selectedIndex].value;
        var timeoutInSeconds_new = document.getElementById('timeout-input').value;
        vscode.postMessage({
        command: 'update_function_settings',
        memoryInMBs: Number(memoryInMBs_new),
        timeoutInSeconds: Number(timeoutInSeconds_new)
        });
      }
    });

});
