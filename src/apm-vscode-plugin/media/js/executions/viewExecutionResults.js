/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function () {

    const vscode = acquireVsCodeApi();

    /** Event : submit form -- START **/
    var resultCount = document.getElementById("view_execution_result_js").text;

    // add event listerner for each Screenshot/HAR button from the execution result 
    for (var i = 1; i <= resultCount; i++) {
        const viewScreenshotButton = document.getElementById('view-screenshot-button-' + i);
        // enable/disbale button based on value being passed in meta data from button definition
        if (viewScreenshotButton) {
            const isEnabled = viewScreenshotButton.dataset.enabled === "true";
            viewScreenshotButton.disabled = !isEnabled;
            // make button grey when disabled
            if (viewScreenshotButton.disabled) {
                viewScreenshotButton.style = "background-color: gray; color: white;"
            }
        }
        viewScreenshotButton.addEventListener('click', () => {
            var vantagePoint = viewScreenshotButton.getAttribute("data-value-vp");
            var executionTime = viewScreenshotButton.getAttribute("data-value-timestamp");
            // Post a message to the extension when the View Screesnhots button is clicked
            vscode.postMessage({
                command: 'view_screenshots',
                vp: vantagePoint,
                timestamp: executionTime
            });
        });

        const viewHarButton = document.getElementById('view-har-button-' + i);
        viewHarButton.addEventListener('click', () => {
            var vantagePoint = viewScreenshotButton.getAttribute("data-value-vp");
            var executionTime = viewScreenshotButton.getAttribute("data-value-timestamp");
            // Post a message to the extension when the View HAR button is clicked
            vscode.postMessage({
                command: 'view_har',
                vp: vantagePoint,
                timestamp: executionTime
            });
        });

        const viewErrorMessageButton = document.getElementById('view-error-message-button-' + i);
        // enable/disbale button based on value being passed in meta data from button definition
        if (viewErrorMessageButton) {
            const isEnabled = viewErrorMessageButton.dataset.enabled === "true";
            viewErrorMessageButton.disabled = !isEnabled;
            // make button grey when disabled
            if (viewErrorMessageButton.disabled) {
                viewErrorMessageButton.style = "background-color: gray; color: white;"
            }
        }
        viewErrorMessageButton.addEventListener('click', () => {
            var vantagePoint = viewErrorMessageButton.getAttribute("data-value-vp");
            var executionTime = viewErrorMessageButton.getAttribute("data-value-timestamp");
            // Post a message to the extension when the View HAR button is clicked
            vscode.postMessage({
                command: 'view_error_message',
                vp: vantagePoint,
                timestamp: executionTime
            });
        });
    }

    /** Event : submit form -- END */

    $("#form_view_execution_results").validate({
        rules: {
        },
        submitHandler: function () {
            return false;
        }
    });
});
