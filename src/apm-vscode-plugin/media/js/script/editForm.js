/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as scriptConstants from './scriptConstants.js';
$(document).ready(function () {

  const vscode = acquireVsCodeApi();
  const errorIds = ['script-error', 'script-file-error'];

  let jsonTextInput;
  let scriptName;
  let scriptFile;
  let scriptFileName;
  let scriptContent = document.getElementById('file-text-input').value;
  let scriptContentType = document.getElementById('script-content-type').value;

  const fileTextInput = document.getElementById('file-text-input');
  fileTextInput.addEventListener('change', function (event) {
    jsonTextInput = editor.getValue(); // fileTextInput.value;
    scriptContent = jsonTextInput;
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
    scriptContent = jsonTextInput;
    var jsonError = validateJsonFile(jsonTextInput);
    if (jsonError) {
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
      readScriptContent(scriptFile), true;
    } catch (e) {
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
      return ErrorJson.validation.script.emptyName;
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
      switch (scriptContentType) {
        case scriptConstants.SCRIPT_CONTENT_TYPE_SIDE:
          return validateSideFileContent(jsonTextInput);
        case scriptConstants.SCRIPT_CONTENT_TYPE_TS:
          return validatePlaywrightFileContent(jsonTextInput);
        default:
          return ErrorJson.validation.script.incorrectScriptContentType;
      }
    } else {
      return ErrorJson.validation.jsonFile.empty;
    }
  };

  const validateSideFileContent = (content) => {
    try {
      let parsedScriptContent = JSON.parse(content);
      if (Object.keys(parsedScriptContent).length === 0) {
        return ErrorJson.validation.sideFile.empty;
      }
    } catch (e) {
      return ErrorJson.validation.sideFile.invalidJson;
    }

    const jsonObject = JSON.parse(content);
    const version = Number(JSON.parse(content).version);
    let error = "";
    let suites;
    let suite;
    let suiteId = "";
    let tests;
    let testsize;
    let countCustomMarker = 0;
    let countCustomScreenshot = 0;

    // validating the sideFile against size (maximum 2 MB)
    if ((content.toString().length / 1024) > scriptConstants._VALID_FILE_SIZE) {
      return ErrorJson.validation.sideFile.fileSizelarge;
    }

    // side script name should not contain forward slash "/"
    if (jsonObject.name && jsonObject.name.includes("/"))
      return ErrorJson.validation.sideFile.invalidScriptName;

    // validating the sideFile for the case where the content can be empty.
    if (content.length === 0)
      return ErrorJson.validation.sideFile.paramIsEmpty;

    // Validate side file version
    if (!Object.keys(jsonObject).includes(scriptConstants._VERSION) || scriptConstants.sideVersionsAndKeysMap.get(version) === undefined)
      return ErrorJson.validation.sideFile.incorrectVersion;

    if (!scriptConstants.sideVersionsAndKeysMap.get(version).every((element) => new Set(Object.keys(jsonObject)).has(element))) {
      return ErrorJson.validation.sideFile.incorrectFormat;
    }
    // Validating version is in double quotes
    if (typeof (JSON.parse(content).version) !== "string") {
      return ErrorJson.validation.sideFile.incorrectVersionType;
    }
    // Validating Suites for Null data
    if (jsonObject.suites !== null) {
      suites = jsonObject.suites;
    } else {
      return ErrorJson.validation.sideFile.nullSuites;
    }
    suite = suites[0];

    // validating the sideFile for the presence of suite ID
    if (suite.id !== null && suite.id !== "" && suite.id !== undefined) {
      suiteId = suite.id;
    } else {
      return ErrorJson.validation.sideFile.nullSuiteId;
    }

    // validating the sideFile for the presence of test id under suites array
    if (suite.tests === null || suite.tests.length <= 0 || suite.tests[0].id === "") {
      return ErrorJson.validation.sideFile.nullSuiteTestId;
    }

    // validating the sideFile for the presence of baseUrl.
    if (jsonObject.url === null || jsonObject.url === "") {
      return ErrorJson.validation.sideFile.nullBaseUrlInSuite;
    } else {
      // validate against url :
      //  https://console.us-ashburn-1.oraclecloud.com/?configoverride={"features":{"apm-synthetics-plugin":true}}
      try {
        new URL(jsonObject.url.toString());
      } catch (e) {
        return ErrorJson.validation.sideFile.invalidUrl;
      }
    }

    if (jsonObject.tests !== null && jsonObject.tests !== undefined) {
      tests = jsonObject.tests;
    } else {
      return ErrorJson.validation.sideFile.nullContentInTestArray;
    }
    testsize = Number(tests.length);

    // validating the sideFile for the presence of multiple test Suites.
    if (testsize > 1) {
      return ErrorJson.validation.sideFile.multipleTestSuites;
    }
    // Validate if id in tests array is null or undefined
    if (!tests[0].id) {
      return ErrorJson.validation.sideFile.emptyIdInTests;
    }

    // validating custom operations - START
    tests && tests.map((test) => {
      const commands = test.commands;
      if (commands && commands.length > 0) {

        // Validate every selenium command has unique id (get objects with duplicate ids then filter out the repeated ids)
        const uniqueIdArr = commands.filter((item, index) => commands.some((elem, idx) => elem.id === item.id && idx !== index)).filter(
          (obj, index, self) => self.findIndex((o) => o.id === obj.id) === index);

        if (uniqueIdArr && uniqueIdArr.length > 0) {
          error = ErrorJson.validation.sideFile.duplicateId;
        }
        commands && commands.map((cmd) => {
          // Custom Marker
          if (scriptConstants.SYNTHETIC_CUSTOM_MARKER_COMMAND === cmd.command && !(Array.from(scriptConstants.customOperations).includes(String(cmd.value)))) {
            error = ErrorJson.validation.sideFile.invalidCustomOpForCustomMetric;
          } else if (scriptConstants.SYNTHETIC_CUSTOM_MARKER_COMMAND === cmd.command && ++countCustomMarker > scriptConstants.SYNTHETIC_CUSTOM_MARKER_COUNT) {
            error = ErrorJson.validation.sideFile.invalidNumOfCustomMetricMarker;
          }

          // Custom Screenshot
          if (scriptConstants.SYNTHETIC_CUSTOM_SCREENSHOT_COMMAND === cmd.command && String(cmd.value).toLocaleLowerCase() !== "true" && String(cmd.value).toLocaleLowerCase() !== "false") {
            error = ErrorJson.validation.sideFile.invalidValueForCustomScreenshots;
          } else if (scriptConstants.SYNTHETIC_CUSTOM_SCREENSHOT_COMMAND === cmd.command && (++countCustomScreenshot > scriptConstants.SYNTHETIC_CUSTOM_SCREENSHOT_COUNT)) {
            error = ErrorJson.validation.sideFile.invalidNumOfCustomScreenshots;
          }

          // TOTP checks
          if (scriptConstants.SYNTHETIC_TIME_BASED_OTP_COMMAND === cmd.command) {
            // const targetValue = cmd.target;
            if (cmd.target === "" || cmd.target === null || cmd.target === undefined) {
              error = ErrorJson.validation.sideFile.invalidTotpCommandVaue;
            }
          }
        });
      }
    });
    // validating custom operations - END

    // Validate atleast one command should be present in commands array
    if (tests && (tests[0].commands === null || tests[0].commands === undefined || tests[0].commands.length === 0)) {
      return ErrorJson.validation.sideFile.nullContentInCommandField;
    }
    if (tests[0].commands && tests[0].commands.length > 0) {
      tests && tests[0].commands.map((object, index) => {
        if (object.id === null || object.id === "" || object.id === undefined) {
          error = ErrorJson.validation.sideFile.file.emptyIdTargetCommand;
        }
        if (object.command === null || object.command === "" || object.command === undefined) {
          error = ErrorJson.validation.sideFile.file.emptyIdTargetCommand;
        }
        if ((object.target === null || object.target === "" || object.target === undefined) && !scriptConstants.sideVersionsAndCmdsWithoutTargetMap.get(version).includes(object.command)) {
          error = ErrorJson.validation.sideFile.emptyIdTargetCommand;
        }
      });
    }
    return error;

  };

  const validatePlaywrightFileContent = (content) => {
    // validating the TS file against size (maximum 2 MB)
    if ((content.toString().length / 1024) > scriptConstants._VALID_FILE_SIZE) {
      return ErrorJson.validation.playwrightFile.sizeLarge;
    }

    //validating the TS file for the case where the content can be empty.
    else if (content.length === 0) {
      return ErrorJson.validation.script.paramIsEmpty;
    }

    // Validate TS file
    // try {
    //   const ast = babelParser.parse(content, {
    //     sourceType: "module",
    //     plugins: ["jsx", "typescript"],
    //   });
    //   const importCount = ast.program.body.filter(node => node.type === 'ImportDeclaration').length;
    //   console.log(importCount);
    //   // if (importCount > 1) {
    //   //   return 'Only one import statement is allowed.';
    //   // }
    // } catch (error) {
    //   return error.message + ErrorJson.validation.playwrightFile.errorLine + error.loc?.line;
    // }

    // final String testRegex = "\\btest\\s*\\(";
    // // Pattern pattern = Pattern.compile(testRegex);
    // Matcher matcher = pattern.matcher(file);
    // if (!matcher.find()) {
    //     log.error("No test method found in playwrightTs script content");
    //     throw RenderableExceptionsGenerator.generateInvalidParameterException(ErrorMessages.PLAYWRIGHT_TS_FILE_NO_TEST_METHOD_FOUND);
    // }

    // Check for test method
    const testRegex = /\btest\s*\(/;
    const matcher = content.match(testRegex);

    if (!matcher) {
      return ErrorJson.validation.playwrightFile.noTestMethodFound;
    }

    // Check for valid import statement
    const importRegex = /import\s*\{\s*(test|expect)(\s*,\s*(test|expect))?\s*\}\s*from\s*['"]@playwright\/test['"]/;
    const importMatcher = importRegex.exec(content);

    if (!importMatcher) {
      return ErrorJson.validation.playwrightFile.invalidImport;
      // throw new Error("Invalid import statement in playwrightTs script content");  // Replace with custom error if needed
    }

    //validating custom operations - START
    const consoleLogPattern = /console\s*\.\s*log\s*\(\s*(['"])([^'"]+)\1\s*\)/g;
    let consoleLogMatcher;
    let countMarker = 0;
    let countCustomScreenshot = 0;
    while ((consoleLogMatcher = consoleLogPattern.exec(content)) !== null) {
      const arg = consoleLogMatcher[2];

      if (arg.includes(scriptConstants.SYNTHETIC_CUSTOM_MARKER_COMMAND)) {
        if (++countMarker > scriptConstants.SYNTHETIC_CUSTOM_MARKER_COUNT) {
          return ErrorJson.validation.playwrightFile.invalidNumOfCustomMarker + ErrorJson.validation.playwrightFile.errorLine + content.split("\n").findIndex((line) => line.includes(arg));
        }
        const values = arg.split(":");
        if (values.length !== 3) {
          return ErrorJson.validation.playwrightFile.customCommandMarkerInvalidFormat + ErrorJson.validation.playwrightFile.errorLine + content.split("\n").findIndex((line) => line.includes(arg));
        } else if (!Array.from(scriptConstants.customOperations).includes(values[1])) {
          return ErrorJson.validation.playwrightFile.invalidCustomOpForCustomMetric + ErrorJson.validation.playwrightFile.errorLine + content.split("\n").findIndex((line) => line.includes(arg));
        }
      } else if (arg.includes(scriptConstants.SYNTHETIC_CUSTOM_SCREENSHOT_COMMAND)) {
        if (++countCustomScreenshot > scriptConstants.SYNTHETIC_CUSTOM_SCREENSHOT_COUNT) {
          return ErrorJson.validation.playwrightFile.invalidNumOfCustomScreenshots + ErrorJson.validation.playwrightFile.errorLine + content.split("\n").findIndex((line) => line.includes(arg));
        }
        const values = arg.split(":");
        if (values.length !== 2) {
          return ErrorJson.validation.playwrightFile.customCommandScreenshotInvalidFormat + ErrorJson.validation.playwrightFile.errorLine + content.split("\n").findIndex((line) => line.includes(arg));
        }
      } else if (arg.includes(scriptConstants.SYNTHETIC_TIME_BASED_OTP_COMMAND)) {
        const values = arg.split(":");
        if (values.length !== 2) {
          return ErrorJson.validation.playwrightFile.invalidTotpCommandVaue + ErrorJson.validation.playwrightFile.errorLine + content.split("\n").findIndex((line) => line.includes(arg));
        } else if (!values[1] || values[1].trim() === "") {
          return ErrorJson.validation.playwrightFile.invalidTotpCommandVaue + ErrorJson.validation.playwrightFile.errorLine + content.split("\n").findIndex((line) => line.includes(arg));
        }
      }
    }
    //validating custom operations - END
  }

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

        // if (!scriptInput.value) { // set name if empty
        scriptFileName = scriptFile.name;
        if (scriptContentType === scriptConstants.SCRIPT_CONTENT_TYPE_SIDE) {
          scriptInput.value = scriptFileName.replace(scriptConstants.SCRIPT_CONTENT_EXT_SIDE, '');
        } else {
          if (scriptFileName.endsWith(scriptConstants.SCRIPT_CONTENT_EXT_SPEC_TS)) {
            scriptInput.value = scriptFileName.replace(scriptConstants.SCRIPT_CONTENT_EXT_SPEC_TS, '');
          } else {
            scriptInput.value = scriptFileName.replace(scriptConstants.SCRIPT_CONTENT_EXT_TS, '');
          }
        }
        scriptName = scriptInput.value;
        var nameError = validateDisplayName(scriptName);
        if (nameError) {
          scriptName = '';
          document.getElementById('script-error-text').innerHTML = nameError;
          showError(errorIds[0]);
          isValid = false;
        }
        // }
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


  function readScriptContent(scriptFile, updateName) {
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

        scriptFileName = scriptFile.name;
        if (updateName) {
          if (scriptContentType === scriptConstants.SCRIPT_CONTENT_TYPE_SIDE) {
            scriptInput.value = scriptFileName.replace(scriptConstants.SCRIPT_CONTENT_EXT_SIDE, '');
          } else {
            if (scriptFileName.endsWith(scriptConstants.SCRIPT_CONTENT_EXT_SPEC_TS)) {
              scriptInput.value = scriptFileName.replace(scriptConstants.SCRIPT_CONTENT_EXT_SPEC_TS, '');
            } else {
              scriptInput.value = scriptFileName.replace(scriptConstants.SCRIPT_CONTENT_EXT_TS, '');
            }
          }
          scriptName = scriptInput.value;
          var nameError = validateDisplayName(scriptInput.value);
          if (nameError) {
            scriptName = '';
            document.getElementById('script-error-text').innerHTML = nameError;
            showError(errorIds[0]);
            isValid = false;
          }
        }
        return isValid;
      };

      reader.onerror = function (evt) {
        scriptContent = '';
        isValid = false;
        document.getElementById('script-error-file').innerHTML = ErrorJson.validation.script.cannotLoad;
        showError(errorIds[1]);
        return isValid;
      };
    } else {
      isValid = false;
      document.getElementById('script-error-file').innerHTML = ErrorJson.validation.script.selectScript;
      showError(errorIds[1]);
      return isValid;
    }
  }

  const ErrorJson = JSON.parse(`{
    "validation": {
      "script": {
        "selectScript": "Script is required.",
        "noContent": "Script is empty.",
        "invalidContent": "Invalid script content.",
        "cannotLoad": "Unable to load script.",
        "cannotParse": "Unable to parse script.",
        "emptyName": "Script name is required.",
        "lengthyName": "Script name is too long.",
        "spaceNotAllowed": "Blank space is not allowed.",
        "invalidName": "Invalid Display Name",
        "parameter": "A maximum of 100 parameters can be provided.",
        "size":  "Script size can't exceed 64 KB.",
        "noScriptCreated": "There are no scripts defined. Before you can create a monitor, you must create a script.",
        "incorrectScriptContentType": "Incorrect script content type",
        "paramIsEmpty": "Invalid content, it cannot be empty" 
      },
      "sideFile": {
        "empty": "Input JSON can not be empty",
        "invalidJson": "Invalid JSON",
        "fileSizelarge": "Side file content is too large, it should not exceed 64 KB.",  
        "invalidScriptName": "Invalid name passed in side file content. Cannot contain forward slash '/'",  
        "incorrectVersion": "Side file content has incorrect version, supported values : 2.0",
        "incorrectFormat": "Incorrect side file content format",
        "incorrectVersionType": "Side file content version should be in double quotes",
        "nullSuites": "Side file content has null content in the 'suites' JSONArray.",
        "nullSuiteId": "Side file content has null or an empty suite id.",
        "nullSuiteTestId": "Side file content has null or empty test id under suites array.",
        "nullBaseUrlInSuite": "Side file content, suite id has an empty or null value for URL.",
        "invalidUrl": "Invalid url provided in side file",
        "nullContentInTestArray": "Side file content, suiteId has null content in the 'tests' JSONArray.",
        "multipleTestSuites": "Side file content has multiple test suites. Not supported yet.",
        "emptyIdInTests": "Side file content has empty id under tests.",
        "emptyCommandsInTests": "Side file content should have atleast one selenium command object under tests.",
        "invalidCustomOpForCustomMetric": "Invalid custom operation passed in side file for custom metric marker.",
        "invalidNumOfCustomMetricMarker": "Custom metric markers cannot be more than 500 in side file.",
        "invalidValueForCustomScreenshots": "Invalid value passed in side file for custom screenshot command.",
        "invalidNumOfCustomScreenshots": "Custom screenshot commands cannot be more than 10 in side file.",
        "invalidTotpCommandVaue": "Invalid target passed in side file for TOTP command. It cannot be null, empty or blank.",
        "nullContentInCommandField": "Side file content has null content for list of Selenium Commands in 'commands' field.",
        "emptyIdTargetCommand": "Side file content has an empty id/command/target for a command number",
        "duplicateId": "Side file content has duplicate id(s) for selenium commands. Please fix the script in the source editor, to add/update/toggle the commands in the table view."
      },
      "playwrightFile": {         
        "sizeLarge": "The uploaded Playwright TS file exceeds the allowed size limit of 64 KB. Please reduce the file size and try again.",
        "noTestMethodFound": "No test method found in the Playwright TS script. Please make sure your script contains one 'test' function.",
        "invalidImport": "The Playwright TS file contains an invalid import statement. Please use a valid import like: 'import \{ test, expect \} from @playwright/test'",
        "invalidNumOfCustomMarker": "The number of custom metric markers oraSynCustomMarker in the Playwright TS file cannot exceed 500.",
        "customCommandMarkerInvalidFormat": "Invalid format for the 'oraSynCustomMarker' command in the Playwright TS file. Please follow the correct syntax.",
        "customCommandScreenshotInvalidFormat": "Invalid format for the 'oraSynCustomScreenshot' command in the Playwright TS file. Please follow the correct syntax.",
        "customCommandTotpInvalidFormat": "Invalid format for the 'oraSynTimeBasedOTP' command in the Playwright TS file. Please follow the correct syntax.",
        "invalidCustomOpForCustomMetric": "The Playwright TS file contains an invalid custom operation for a custom metric marker oraSynCustomMarker. Valid operations are: 'setValue, startTime, endTime'.",
        "invalidNumOfCustomScreenshots": "The number of custom screenshot commands oraSynCustomScreenshot in the Playwright TS file cannot exceed 10.",
        "invalidTotpCommandVaue": "The TOTP command oraSynTimeBasedOTP in the Playwright TS file requires a valid value. It cannot be null, empty, or blank.",
        "errorLine": "Error on line:"
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

  const editButton = document.getElementById('edit-button');
  editButton.addEventListener('click', () => {
    scriptContent = editor.getValue();
    //hide previous error 
    hideErrors();
    //validate form inputs
    if (isValidateForm() === false) {
      return;
    }
    hideErrors();

    // Post a message to the extension when the Edit button is clicked
    vscode.postMessage({
      command: 'edit_script',
      scriptName: scriptName,
      scriptContent: scriptContent
    });
  });
  /** Event : submit form -- END */

  $("#form_edit_script").validate({
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
