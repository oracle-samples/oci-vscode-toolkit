/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function () {
  const vscode = acquireVsCodeApi();

  /** Event : submit form -- START **/
  const cancelButton = document.getElementById('cancel-button');
  cancelButton.addEventListener('click', () => {
    // Post a message to the extension when the Cancel button is clicked
    vscode.postMessage({ command: 'cancel' });
  });

  const downloadButton = document.getElementById('download-button');
  downloadButton.addEventListener('click', () => {
    // Post a message to the extension when the Download button is clicked
    vscode.postMessage({
      command: 'download',
      vp: vantagePoint,
      timestamp: executionTime
    });
  });


  /** Download Logs, Hars, Screenshots **/
  window.addEventListener('message', event => {
    const message = event.data;
    switch (message.command) {
      case 'download_hars':
      case 'download_logs':
      case 'download_screenshots':
        var status;
        var data = message.content;
        var filename = message.fileName;
        try {
          const blob = new Blob([data], { type: "application/zip" });
          const link = document.createElement("a");
          link.download = filename;
          const url = window.URL.createObjectURL(blob);
          link.href = "data:application/zip;base64," + data;
          const evt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
          });
          link.dispatchEvent(evt);
          link.remove();
          status = true;
        } catch (error) {
          status = false;
        }
        vscode.postMessage({
          command: 'download_complete',
          status: status
        });
        break;
      case 'cancel':
        vscode.postMessage({
          command: 'download_complete',
          status: false
        });
        break;
    }
  });

  /** Event : submit form -- END */

  $("#form_download_file").validate({
    rules: {
    },
    submitHandler: function (form) {
      return false;
    }
  });


});
