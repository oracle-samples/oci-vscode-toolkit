/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function() {
    $( "#form_deploy_function" ).validate({
      rules: {
        timeout_input: {
          required: true,
          range: [5, 300]
        },
        registry_location_input: {
          required: true,

        },
        auth_token_input: {
          required: true
        }
      },
      submitHandler: function() {
        const vscode = acquireVsCodeApi();
        var select_obj = document.getElementById('memory-input');
        var memoryInMBs_new = select_obj.options[select_obj.selectedIndex].value;
        var timeoutInSeconds_new = document.getElementById('timeout-input').value;
        var registryLocation = document.getElementById('registry-location-input').value;
        var authToken = document.getElementById('auth-token-input').value;
        var verboseLevel = document.getElementById('output-level-checkbox').checked;
        
        vscode.postMessage({
          command: 'deploy_function',
          memoryInMBs: Number(memoryInMBs_new),
          timeoutInSeconds: Number(timeoutInSeconds_new),
          registryLocation: registryLocation,
          authToken: authToken,
          verboseLevel: Boolean(verboseLevel)
        });
        
      }
    });

});
