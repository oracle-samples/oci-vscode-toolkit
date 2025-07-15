/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function () {

    const vscode = acquireVsCodeApi();
    const errorIds = ['start-error', 'end-error'];

    let selectedTime;
    let startDate;
    let endDate;

    function formatUTC(date) {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
            "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        const yyyy = date.getUTCFullYear();
        const MMM = months[date.getUTCMonth()];
        const dd = String(date.getUTCDate()).padStart(2, '0');
        const HH = String(date.getUTCHours()).padStart(2, '0');
        const mm = String(date.getUTCMinutes()).padStart(2, '0');
        const ss = String(date.getUTCSeconds()).padStart(2, '0');

        return `${MMM} ${dd}, ${yyyy} ${HH}:${mm}:${ss} UTC`;
    }

    const rangeInput = document.getElementById('range-input');
    rangeInput.addEventListener('change', function (event) {
        selectedTime = rangeInput.options[rangeInput.selectedIndex].text;
        let display = 'none';
        startDate = undefined;
        endDate = undefined;

        if (selectedTime === 'Custom') {
            var today = new Date();
            endDate = new Date(today.toUTCString());
            today.setHours(today.getHours() - 1);
            startDate = new Date(today.toUTCString());
            startDateInput.value = formatUTC(startDate);
            endDateInput.value = formatUTC(endDate);
            display = 'block';
        }
        document.getElementById('col1-div').style.display = display;
        document.getElementById('col2-div').style.display = display;
    });

    function getStartDate(stDate) {
        var dateError = validateDate(stDate, true);
        if (dateError) {
            startDate = undefined;
            document.getElementById('start-error-text').innerHTML = dateError;
            showError('start-error');
            return;
        }
        startDate = stDate;
        hideError('start-error');
    }

    function getEndDate(enDate) {
        var dateError = validateDate(enDate, false);
        if (dateError) {
            endDate = undefined;
            document.getElementById('end-error-text').innerHTML = dateError;
            showError('end-error');
            return;
        }
        endDate = enDate;
        hideError('end-error');
    }

    const startDateInput = document.getElementById('start-input');
    startDateInput.addEventListener('change', function (event) {
        getStartDate(startDateInput.value);
    });

    startDateInput.addEventListener('input', function (event) {
        getStartDate(startDateInput.value);
    });

    const endDateInput = document.getElementById('end-input');
    endDateInput.addEventListener('change', function (event) {
        getEndDate(endDateInput.value);
    });

    endDateInput.addEventListener('input', function (event) {
        getEndDate(endDateInput.value);
    });

    function isValidDate(d) {
        return d instanceof Date && !isNaN(d);
    }

    const validateDate = (dt, start) => {
        try {
            if (dt.length === 0) {
                return ErrorJson.validation.execution.empty;
            }
            let d = new Date(dt);
            if (!isValidDate(d)) {
                return ErrorJson.validation.execution.invalidDate;
            }
        } catch (error) {
            return ErrorJson.validation.execution.invalidDate;
        }
    };

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
        "execution": {
          "start": "Start time is required.",
          "end": "End time is required.",
          "empty": "Date can not be empty",
          "invalidDate": "Invalid Date",
          "parameter": "A maximum of 100 parameters can be provided.",
          "invalidRange":"Time range must not be more than 7 days.",
          "invalidStart":"Start date cannot occur after end date."
        }
      }
    }`);

    function isValidateForm() {
        let isValid = true;
        if (selectedTime === undefined) {
            selectedTime = rangeInput.options[rangeInput.selectedIndex].text;
        }
        if (selectedTime === 'Custom') {
            var stError = validateDate(startDate, true);
            if (stError) {
                document.getElementById('start-error-text').innerHTML = stError;
                showError(errorIds[0]);
                isValid = false;
            }

            var enError = validateDate(endDate, false);
            if (enError) {
                document.getElementById('end-error-text').innerHTML = enError;
                showError(errorIds[1]);
                isValid = false;
            }

            if (isValid) {
                var st = new Date(startDate);
                var en = new Date(endDate);
                if (st.getTime() > en.getTime()) {
                    document.getElementById('start-error-text').innerHTML = ErrorJson.validation.execution.invalidStart;
                    showError(errorIds[0]);
                    isValid = false;
                }
                var prev = new Date(st);
                prev = prev.setDate(prev.getUTCDate() + 7);
                if (prev < en.getTime()) {
                    document.getElementById('end-error-text').innerHTML = ErrorJson.validation.execution.invalidRange;;
                    showError(errorIds[1]);
                    isValid = false;
                }
            }
        }

        return isValid;
    }

    /** Event : submit form -- START **/
    const cancelButton = document.getElementById('cancel-button');
    cancelButton.addEventListener('click', () => {
        // Post a message to the extension when the Cancel button is clicked
        vscode.postMessage({ command: 'cancel' });
    });

    const createButton = document.getElementById('get-results-button');
    createButton.addEventListener('click', () => {
        //hide previous error 
        hideErrors();
        //validate form inputs
        if (isValidateForm() === false) {
            return;
        }

        // Post a message to the extension when 'Get Execution Results' button is clicked
        vscode.postMessage({
            command: 'get_results',
            selectedTime: selectedTime,
            startDate: startDate,
            endDate: endDate
        });
    });
    /** Event : submit form -- END */

    $("#form_get_result").validate({
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
