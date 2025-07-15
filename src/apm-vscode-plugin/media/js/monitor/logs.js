/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function () {

    const vscode = acquireVsCodeApi();
    const errorIds = ['time-error', 'vp-error'];
    const VP_LIMIT = 100;

    let selectedTime;
    let vantagePoints;

    const selectedVpObj = document.getElementById('vantage-point-input');
    selectedVpObj.addEventListener('change', function (event) {
        var selectedOpts = Array.from(selectedVpObj.selectedOptions);
        const vps = selectedOpts.map(option => option.value);
        var vpError = validateVPs(vps);
        if (vpError) {
            showError(errorIds[1]);
            document.getElementById('vp-error-text').innerHTML = vpError;
            return;
        }

        hideError(errorIds[1]);
        vantagePoints = selectedOpts.map(option => option.value)[0];
    });

    const timestampInput = document.getElementById('time-input');
    timestampInput.addEventListener('change', function (event) {
        getTimestamp(timestampInput.value);
    });

    timestampInput.addEventListener('input', function (event) {
        getTimestamp(timestampInput.value);
    });

    // returns true if string is empty (e.g. '')
    function isEmpty(s) {
        return s?.trim() === '';
    }

    // returns true if string includes spaces (e.g. 'hello space')
    function hasSpaces(s) {
        return s.includes(' ');
    }

    const validateDate = (dt) => {
        try {
            if (isEmpty(dt)) {
                return ErrorJson.validation.timestamp.empty;
            }
            if (isNaN(dt)) {
                return ErrorJson.validation.timestamp.invalidDate;
            }
        } catch (error) {
            return ErrorJson.validation.timestamp.invalidDate;
        }
    };

    const validateVPs = (VPNames) => {
        if (VPNames && VPNames[0] === '-1') {
            return ErrorJson.validation.vantagePoints.empty;
        } else if (VPNames && VPNames.length) {
            return VPNames.length > VP_LIMIT ?
                ErrorJson.validation.vantagePoints.limited : undefined;
        }
    };

    function getTimestamp(stDate) {
        var dateError = validateDate(stDate);
        if (dateError) {
            selectedTime = undefined;
            document.getElementById('time-error-text').innerHTML = dateError;
            showError(errorIds[0]);
            return;
        }
        selectedTime = stDate;
        hideError(errorIds[0]);
    }

    function showError(id) {
        document.getElementById(id).style.display = 'block';
    }

    function hideError(id) {
        document.getElementById(id).style.display = 'none';
    }

    function hideErrors() {
        _hideErrors(errorIds);
    }

    function _hideErrors(args) {
        for (var i = 0; i < args.length; i++) {
            document.getElementById(args[i]).style.display = 'none';
        }
    }

    const ErrorJson = JSON.parse(`{
      "validation": {
        "timestamp": {
          "empty": "Timestamp can not be empty",
          "invalidDate": "You must provide a valid timestamp"
        },
        "vantagePoints": {
            "limited": "A maximum of 100 vantage points can be selected.",
            "empty": "Select a vantage point."
        }
      }
    }`);

    function isValidateForm() {
        let isValid = true;
        var selectedOpts = Array.from(selectedVpObj.selectedOptions);
        const vps = selectedOpts.map(option => option.value);
        var vpError = validateVPs(vps);
        if (vpError) {
            showError(errorIds[1]);
            document.getElementById('vp-error-text').innerHTML = vpError;
            isValid = false;
        }
        var tsError = validateDate(timestampInput.value);
        if (tsError) {
            showError(errorIds[0]);
            document.getElementById('time-error-text').innerHTML = tsError;
            isValid = false;
        }

        return isValid;
    }

    /** Event : submit form -- START **/
    const cancelButton = document.getElementById('cancel-button');
    cancelButton.addEventListener('click', () => {
        // Post a message to the extension when the Cancel button is clicked
        vscode.postMessage({ command: 'cancel' });
    });

    const getLogsButton = document.getElementById('get-logs-button');
    getLogsButton.addEventListener('click', () => {
        //hide previous error 
        hideErrors();
        //validate form inputs
        if (isValidateForm() === false) {
            return;
        }
        // Post a message to the extension when 'Get Logs/Har/Screenshot' button is clicked
        vscode.postMessage({
            command: execType,
            timestamp: selectedTime,
            vp: vantagePoints
        });

    });
    /** Event : submit form -- END */

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
                break;
        }
    });

    $("#form_get_logs").validate({
        rules: {
            startDate: {
                required: true,
                range: [1, 256]
            },
            endDate: {
                required: true
            }
        },
        submitHandler: function () {
            return false;
        }
    });
});
