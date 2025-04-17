/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function () {

  const vscode = acquireVsCodeApi();
  const errorIds = ['script-error', 'script-file-error'];

  let jsonTextInput;
  let scriptName;
  let scriptFile;
  let scriptFileName;
  var scriptContent;

  const fileTextInput = document.getElementById('file-text-input');
  fileTextInput.addEventListener('change', function (event) {
    jsonTextInput = fileTextInput.value;
    var jsonError = validateJsonFile(jsonTextInput);
    if (jsonError) {
      scriptContent = jsonTextInput;
      document.getElementById('file-text-error').innerHTML = jsonError;
      showError('file-text-input-error');
      return;
    }
    hideError('file-text-input-error');
  });

  fileTextInput.addEventListener('input', function (event) {
    jsonTextInput = fileTextInput.value;
    var jsonError = validateJsonFile(jsonTextInput);
    if (jsonError) {
      scriptContent = jsonTextInput;
      document.getElementById('file-text-error').innerHTML = jsonError;
      showError('file-text-input-error');
      return;
    }
    hideError('file-text-input-error');
  });

  const scriptInput = document.getElementById('script-name-input');
  scriptInput.addEventListener('change', function (event) {
    var nameError = validateDisplayName(scriptInput.value);
    if (nameError) {
      scriptName = '';
      document.getElementById('script-error-text').innerHTML = nameError;
      showError(errorIds[0]);
      return;
    }
    scriptName = scriptInput.value;
    hideError(errorIds[0]);
  });

  scriptInput.addEventListener('input', function (event) {
    var nameError = validateDisplayName(scriptInput.value);
    if (nameError) {
      scriptName = '';
      document.getElementById('script-error-text').innerHTML = nameError;
      showError(errorIds[0]);
      return;
    }
    scriptName = scriptInput.value;
    hideError(errorIds[0]);
  });

  const loadedFileInput = document.getElementById('script-file-input');
  loadedFileInput.addEventListener('change', function (event) {
    hideError(errorIds[1]);
    try {
      scriptFile = loadedFileInput.files[0];
      readScriptContent(scriptFile);
    } catch (e) {
      showError(errorIds[1]);
      return;
    }
  });

  const validateDisplayName = (displayName) => {
    if (displayName) {
      return displayName.length > 255 ? ErrorJson.validation.script.lengthyName :
        (/\s/.test(displayName)) ? ErrorJson.validation.script.spaceNotAllowed :
          !(/^[a-zA-Z_](-?[a-zA-Z_0-9])*$/.test(displayName)) ?
            ErrorJson.validation.script.invalidName : '';
    } else {
      return ErrorJson.validation.script.empty;
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

  const validateJSON = (content) => {
    try {
      JSON.parse(content);
      return true;
    } catch (e) {
      return false;
    }
  };

  const validateJsonFile = (jsonTextInput) => {
    if (jsonTextInput) {
      try {
        let parsedScriptContent = JSON.parse(jsonTextInput);
        if (Object.keys(parsedScriptContent).length === 0) {
          return ErrorJson.validation.jsonFile.empty;
        }
      } catch (e) {
        return ErrorJson.validation.jsonFile.invalidJson;
      }
    } else {
      return ErrorJson.validation.jsonFile.empty;
    }
  };

  function readScriptContent(scriptFile) {
    let isValid = true;
    if (scriptFile) {
      var reader = new FileReader();
      reader.readAsText(scriptFile, "UTF-8");

      reader.onload = function (evt) {
        scriptContent = evt.target.result;
        document.getElementById('file-text-input').value = scriptContent;

        var jsonError = validateJsonFile(scriptContent);
        if (jsonError) {
          document.getElementById('file-text-error').innerHTML = jsonError;
          showError('file-text-input-error');
          return false;
        }
        hideError('file-text-input-error');

        if (!scriptInput.value) { // set name if empty
          scriptFileName = scriptFile.name;
          scriptInput.value = scriptFileName.replace('.side', '');
          scriptName = scriptInput.value;
          var nameError = validateDisplayName(scriptName);
          if (nameError) {
            scriptName = '';
            document.getElementById('script-error-text').innerHTML = nameError;
            showError(errorIds[0]);
            isValid = false;
          }
        }
      };

      reader.onerror = function (evt) {
        scriptContent = '';
        isValid = false;
        showError(errorIds[1]);
      };
    } else {
      isValid = false;
      showError(errorIds[1]);
    }
    return isValid;
  }

  const ErrorJson = JSON.parse(`{
    "validation": {
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
      "jsonFile": {
        "empty": "Input JSON can not be empty",
        "invalidJson": "Invalid JSON"
      }
    }
  }`);

  function isValidateForm() {
    let isValid = true;
    var nameError = validateDisplayName(scriptInput.value);
    if (nameError) {
      document.getElementById('script-error-text').innerHTML = nameError;
      showError(errorIds[0]);
      isValid = false;
    }

    var jsonError = validateJsonFile(scriptContent);
    if (jsonError) {
      isValid = false;
      document.getElementById('file-text-error').innerHTML = jsonError;
      showError('file-text-input-error');
    }

    return isValid;
  }

  /** Event : submit form -- START **/
  const cancelButton = document.getElementById('cancel-button');
  cancelButton.addEventListener('click', () => {
    // Post a message to the extension when the Cancel button is clicked
    vscode.postMessage({ command: 'cancel' });
  });

  const createButton = document.getElementById('create-button');
  createButton.addEventListener('click', () => {
    //hide previous error 
    hideErrors();
    //validate form inputs
    if (isValidateForm() === false) {
      return;
    }

    // Post a message to the extension when the Create button is clicked
    vscode.postMessage({
      command: 'create_script',
      scriptName: scriptName,
      scriptContent: scriptContent,
      scriptFileName: scriptFileName
    });
  });
  /** Event : submit form -- END */

  $("#form_create_script").validate({
    rules: {
      scriptName: {
        required: true,
        range: [1, 256]
      },
      scriptFile: {
        required: true
      }
    },
    submitHandler: function () {
      return false;
    }
  });
});
