/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function () {

  const vscode = acquireVsCodeApi();
  const errorIds = ['monitor-error', 'script-error', 'vp-error'];
  const apmDomainId = document.getElementById('apmdomain-id-input').value;
  const monitorId = document.getElementById('monitor-id-input').value;

  let jsonData;

  let jsonTextInput = document.getElementById('file-text-input').value;
  let editType;
  //let status = 'ENABLED'; | DISABLED | INVALID

  function editFrom(editType) {
    if (editType === 'ui') {
      document.getElementById('form-buttons').style.display = 'block';
      document.getElementById('col1-div').style.display = 'block';
      document.getElementById('col2-div').style.display = 'block';
      document.getElementById('file-div').style.display = 'none';
      document.getElementById('file-text-div').style.display = 'none';
    } else {
      document.getElementById('col1-div').style.display = 'none';
      document.getElementById('col2-div').style.display = 'none';
      document.getElementById('form-buttons').style.display = 'block';
      document.getElementById('file-div').style.display = 'block';
      document.getElementById('file-text-div').style.display = 'block';
    }
  }

  const createFileInput = document.getElementById('from-file-radio');
  createFileInput.addEventListener('change', function (event) {
    editType = createFileInput.value;
    editFrom(editType);
  });

  const createUiInput = document.getElementById('from-ui-radio');
  createUiInput.addEventListener('change', function (event) {
    editType = createUiInput.value;
    editFrom(editType);
  });

  /** Required fields **/
  const fileTextInput = document.getElementById('file-text-input');
  fileTextInput.addEventListener('change', function (event) {
    jsonTextInput = editor.getValue(); // fileTextInput.value;
    var jsonError = validateJsonFile(jsonTextInput);
    if (jsonError) {
      document.getElementById('file-text-error').innerHTML = jsonError;
      showError('file-text-input-error');
      return;
    }
    hideError('file-text-input-error');
  });

  fileTextInput.addEventListener('input', function (event) {
    jsonTextInput = editor.getValue(); // fileTextInput.value;
    var jsonError = validateJsonFile(jsonTextInput);
    if (jsonError) {
      document.getElementById('file-text-error').innerHTML = jsonError;
      showError('file-text-input-error');
      return;
    }
    hideError('file-text-input-error');
  });

  const loadFromJsonInputsButton = document.getElementById('load-json-button');
  loadFromJsonInputsButton.addEventListener('change', function (event) {
    const file = event.target.files[0];
    if (file) {
      document.getElementById('form-buttons').style.display = 'block';
      document.getElementById('file-text-div').style.display = 'block';
      const reader = new FileReader();
      reader.onload = function () {
        var jsonError = validateJsonFile(reader.result);
        if (jsonError) {
          document.getElementById('file-text-error').innerHTML = jsonError;
          showError('file-text-input-error');
          return;
        }
        hideError('file-text-input-error');

        document.getElementById('file-text-input').value = JSON.stringify(jsonData, null, 2) || '';
      };
      reader.readAsText(file);
    }
  });

  loadFromJsonInputsButton.addEventListener('input', function (event) {
    const file = event.target.files[0];
    if (file) {
      document.getElementById('form-buttons').style.display = 'block';
      document.getElementById('file-text-div').style.display = 'block';
      const reader = new FileReader();
      reader.onload = function () {
        var jsonError = validateJsonFile(reader.result);
        if (jsonError) {
          document.getElementById('file-text-error').innerHTML = jsonError;
          showError('file-text-input-error');
          return;
        }
        hideError('file-text-input-error');

        document.getElementById('file-text-input').value = JSON.stringify(jsonData, null, 2) || '';
      };
      reader.readAsText(file);
    }
  });

  /** Event : submit form -- START **/
  const cancelButton = document.getElementById('cancel-button');
  cancelButton.addEventListener('click', () => {
    // Post a message to the extension when the Cancel button is clicked
    vscode.postMessage({ command: 'cancel' });
  });

  const saveAsJsonButton = document.getElementById('save-json-button');
  saveAsJsonButton.addEventListener('click', () => {
    hideErrors();
    if (isValidateJsonFileForm() === false) {
      return;
    }

    let status = saveAsFile(jsonData.displayName + '.json', "JSON", jsonData);

    // Post a message to the extension when the save button is clicked
    vscode.postMessage({
      command: 'save_as_json',
      monitorName: jsonData['displayName'],
      monitorJson: jsonData,
      status: status
    });
  });

  const editButton = document.getElementById('edit-button');
  editButton.addEventListener('click', () => {
    hideErrors();
    if (isValidateJsonFileForm() === false) {
      return;
    }
    // Post a message to the extension when the Create button is clicked
    vscode.postMessage({
      command: 'edit_monitor',
      apmDomainId: apmDomainId,
      monitorId: monitorId,
      monitorJson: jsonData
    });
  });
  /** Event : submit form -- END */

  $("#form_edit_monitor").validate({
    rules: {
      monitorName: {
        required: true,
        range: [1, 256]
      },
      scriptId: {
        required: true
      },
      selectedVPList: {
        required: true
      }
    },
    submitHandler: function () {
      return false;
    }
  });

  // PVP conditions

  const ErrorJson = JSON.parse(`{
    "validation": {
      "displayName": {
        "empty": "Monitor name is required.",
        "lengthy": "Monitor name is too long.",
        "spaceNotAllowed": "Blank space is not allowed.",
        "invalidName": "Invalid display name"
      },
      "type": {
        "empty": "Type is required."
      },
      "parameter": {
        "lengthy": "{paramName} is too long.",
        "empty": "{paramName} is required."
      },
      "script": {
        "empty": "Script is required.",
        "emptyName": "Script name is required.",
        "lengthyName": "Script name is too long.",
        "spaceNotAllowed": "Blank space is not allowed.",
        "invalidName": "Invalid Display Name",
        "parameter": "A maximum of 100 parameters can be provided.",
        "size":  "Script size can't exceed 64 KB.",
        "noScriptCreated": "There are no scripts defined. Before you can create a monitor, you must create a script."
      },
      "scriptParameters": {
        "invalidJson": "Invalid script parameters json."
      },
      "target": {
        "empty": "Base URL is required.",
        "portNotAllowed": "Invalid format/port number not required for ICMP.",
        "protocolNotAllowed": "Only server name or server ip is allowed.",
        "ftpDomainError": "Only server name or server ip is allowed. Port is optional.",
        "networkIPV6Error": "Invalid format/port number is required.",
        "portMandatory": "Invalid format/port number is required.",
        "domainEmpty": "Domain is required.",
        "domainProtocolNotAllowed": "Only domain name is allowed.",
        "ptrFormatError": "Invalid format for PTR record.",
        "invalidProtocolFormat": "Base URL format is not valid."
      },
      "vantagePoints": {
        "limited": "A maximum of 100 vantage points can be selected.",
        "empty": "At least one vantage point is required."
      },
      "definedTags": {
        "invalidJson": "Invalid defined tags json."
      },
      "freeformTags": {
        "invalidJson": "Invalid freeform tags json."
      },
      "jsonFile": {
        "empty": "Input JSON can not be empty",
        "invalidJson": "Invalid JSON"
      }
    }
  }`);

  const validateJsonFile = (jsonTextInput) => {
    if (jsonTextInput) {
      try {
        jsonData = JSON.parse(jsonTextInput);
        if (Object.keys(jsonData).length === 0) {
          return ErrorJson.validation.jsonFile.empty;
        }
        let configType;
        // add monitor type to avoid error case where this edit file can be saved as json and then used in create monitor flow
        if (jsonData['monitorType'] === undefined) {
          configType = jsonData['configuration']['configType'];
          switch (configType) {
            case 'BROWSER_CONFIG':
              jsonData['monitorType'] = "BROWSER";
              break;
            case 'SCRIPTED_BROWSER_CONFIG':
              jsonData['monitorType'] = "SCRIPTED_BROWSER";
              break;
            case 'REST_CONFIG':
              jsonData['monitorType'] = "REST";
              break;
            case 'SCRIPTED_REST_CONFIG':
              jsonData['monitorType'] = "SCRIPTED_REST";
              break;
            case 'NETWORK_CONFIG':
              jsonData['monitorType'] = "NETWORK";
              break;
            case 'SQL_CONFIG':
              jsonData['monitorType'] = "SQL";
              break;
            case 'FTP_CONFIG':
              jsonData['monitorType'] = "FTP";
              break;
            case 'DNS_SERVER_CONFIG':
            case 'DNS_TRACE_CONFIG':
            case 'DNSSEC_CONFIG':
              jsonData['monitorType'] = "DNS";
              break;
            default:
              vscode.window.showErrorMessage(localize('incorrectMonitorType', 'Incorrect monitor type'));
              return newCancellation();
          }
        }
      } catch (e) {
        return ErrorJson.validation.jsonFile.invalidJson;
      }
    } else {
      return ErrorJson.validation.jsonFile.empty;
    }
  };

  const validateJSON = (content) => {
    try {
      JSON.parse(content);
      return true;
    } catch (e) {
      return false;
    }
  };

  /** Form validation -- Start **/

  function isValidateJsonFileForm() {
    let isValid = true;
    jsonTextInput = editor.getValue();
    var jsonError = validateJsonFile(jsonTextInput);
    if (jsonError) {
      document.getElementById('file-text-error').innerHTML = jsonError;
      showError('file-text-input-error');
      isValid = false;
    }

    return isValid;
  }

  function hideErrors() {
    _hideErrors(errorIds);
  }

  function showErrors() {
    _showErrors(errorIds);
  }

  function showError(id) {
    document.getElementById(id).style.display = 'block';
  }

  function _showErrors(args) {
    for (var i = 0; i < args.length; i++) {
      document.getElementById(args[i]).style.display = 'block';
    }
  }

  function hideError(id) {
    document.getElementById(id).style.display = 'none';
  }

  function _hideErrors(args) {
    for (var i = 0; i < args.length; i++) {
      document.getElementById(args[i]).style.display = 'none';
    }
  }

  /** Form validation -- End **/

});
