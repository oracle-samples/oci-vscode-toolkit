/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function () {

  const vscode = acquireVsCodeApi();
  const errorIds = ['monitor-error', 'script-error', 'vp-error'];
  const MON_TYPE = 'SCRIPTED_BROWSER';
  const VP_LIMIT = 100;
  const apmDomainId = document.getElementById('apmdomain-id-input').value;
  const monitorId = document.getElementById('monitor-id-input').value;


  // use this object to save json file. if any monitor fields is updated, then update this object too.
  // const monitorJsonValue = document.getElementById("monitor-json").value;
  let jsonData = document.getElementById('file-text-input').value;
  // update it if any monitor field changes; if this object contains no fields, then don't update monitor
  let updatedJson = jsonData;

  /** lets do not add these fields **/
  //updatedJson['apmDomainId'] = apmDomainId;
  //updatedJson['monitorId'] = monitorId;
  //updatedJson['monitorType'] = monitorType;
  //updatedJson['status'] = status;

  let jsonTextInput = document.getElementById('file-text-input').value;
  let editType;
  //let status = 'ENABLED'; | DISABLED | INVALID
  let monitorType = 'SCRIPTED_BROWSER';
  let displayName;
  let vantagePoints;
  let target;
  let scriptId;
  let status = 'ENABLED';
  let repeatIntervalInSeconds = 600;
  let isRunOnce = true;
  let isRunNow = false;
  let timeoutInSeconds = 180;
  let scriptParameters;
  let isCertificateValidationEnabled;
  let isDefaultSnapshotEnabled;
  let isFailureRetried;
  let dnsConfiguration;
  let isOverrideDns;
  let overrideDnsIp;
  let configType = 'SCRIPTED_BROWSER_CONFIG';
  let numberOfHops = 30;
  let transmissionRate = 16;
  let networkConfiguration;
  let isNetwork;
  let probePerHop;
  let probeMode; // tcp/icmp
  let protocolOpt; // syn/sack - tcp
  let availabilityConfiguration;
  let isAvailability;
  let maxAllowedFailuresPerInterval;
  let minAllowedRunsPerInterval;
  let timeStarted;
  let timeEnded;
  let maintenanceWindowSchedule;
  let schedulingPolicy;
  let batchIntervalInSeconds;
  let isIPv6;
  let definedTags;
  let freeformTags;

  /** call this function when load from JSON fn is implemented **/
  function popupateRemainingFields() {
    maintenanceWindowSchedule = monitorJson['maintenanceWindowSchedule'];
    if (maintenanceWindowSchedule && Object.keys(maintenanceWindowSchedule).length !== 0) {
      updatedJson['maintenanceWindowSchedule'] = maintenanceWindowSchedule;
    }
    status = monitorJson['status'];
    if (status !== undefined && status !== "") {
      updateMonitorDetails['status'] = status;
    }
    updateMonitorDetails['configType'] = configType;
    updateMonitorDetails['monitorType'] = monitorType;
    updateMonitorDetails['isIPv6'] = isIPv6;
    updateMonitorDetails['isRunNow'] = isRunNow;
  }

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
    jsonTextInput = fileTextInput.value;
    var jsonError = validateJsonFile(jsonTextInput);
    if (jsonError) {
      document.getElementById('file-text-error').innerHTML = jsonError;
      showError('file-text-input-error');
      return;
    }
    updatedJson = jsonData;
    hideError('file-text-input-error');
  });

  fileTextInput.addEventListener('input', function (event) {
    jsonTextInput = fileTextInput.value;
    var jsonError = validateJsonFile(jsonTextInput);
    if (jsonError) {
      document.getElementById('file-text-error').innerHTML = jsonError;
      showError('file-text-input-error');
      return;
    }
    updatedJson = jsonData;
    hideError('file-text-input-error');
  });

  const monitorInput = document.getElementById('monitor-name-input');
  monitorInput.addEventListener('change', function (event) {
    var nameError = validateDisplayName(monitorInput.value);
    if (nameError) {
      document.getElementById('monitor-error-text').innerHTML = nameError;
      showError(errorIds[0]);
      return;
    }

    hideError(errorIds[0]);
    displayName = monitorInput.value;
    jsonData['displayName'] = displayName;
    updatedJson['displayName'] = displayName;
  });

  monitorInput.addEventListener('input', function (event) {
    var nameError = validateDisplayName(monitorInput.value);
    if (nameError) {
      document.getElementById('monitor-error-text').innerHTML = nameError;
      showError(errorIds[0]);
      return;
    }
    hideError(errorIds[0]);
  });

  displayName = monitorInput.value;

  const targetInput = document.getElementById('target-input');
  targetInput.addEventListener('change', function (event) {
    var targetError = validateBaseUrl(targetInput.value, 'SCRIPTED_BROWSER');
    if (targetError) {
      document.getElementById('target-error-text').innerHTML = targetError;
      showError('target-error');
      return;
    }
    hideError('target-error');
    target = targetInput.value;
    jsonData['target'] = target;
    updatedJson['target'] = target;
  });

  targetInput.addEventListener('input', function (event) {
    var targetError = validateBaseUrl(targetInput.value, 'SCRIPTED_BROWSER');
    if (targetError) {
      document.getElementById('target-error-text').innerHTML = targetError;
      showError('target-error');
      return;
    }
    hideError('target-error');
  });

  // frequency
  function setFrequency(freqValue) {
    if (freqValue === 'interval') {
      document.getElementById('interval-div').style.display = 'block';
      isRunOnce = false;
      repeatIntervalInSeconds = repeatIntervalInput.value * 60;
      schedulingPolicy = scheduleInput.options[scheduleInput.selectedIndex].value;

      //console.log('setFrequency : ' + schedulingPolicy + ',' + intervalInput.value);
      if (schedulingPolicy === 'BATCHED_ROUND_ROBIN') {
        document.getElementById('batch-div').style.display = 'block';
        batchIntervalInSeconds = batchIntervalInput.value * 60;
      } else {
        document.getElementById('batch-div').style.display = 'none';
        batchIntervalInSeconds = 0;
      }
    } else {
      document.getElementById('interval-div').style.display = 'none';
      repeatIntervalInSeconds = 600; // Or leave it as it is
      batchIntervalInSeconds = 0;
      schedulingPolicy = 'ALL'; // Run Once is only supported with ALL Scheduling Policy
      isRunOnce = true;
    }
    jsonData["isRunOnce"] = isRunOnce;
    jsonData['schedulingPolicy'] = schedulingPolicy;
    jsonData['batchIntervalInSeconds'] = batchIntervalInSeconds;
    jsonData['repeatIntervalInSeconds'] = repeatIntervalInSeconds;

    updatedJson['isRunOnce'] = isRunOnce;
    updatedJson['schedulingPolicy'] = schedulingPolicy;
    updatedJson['batchIntervalInSeconds'] = batchIntervalInSeconds;
    updatedJson['repeatIntervalInSeconds'] = repeatIntervalInSeconds;
  }

  const scheduleInput = document.getElementById('scheduling-input');
  scheduleInput.addEventListener('change', function (event) {
    schedulingPolicy = scheduleInput.options[scheduleInput.selectedIndex].value;
    //jsonData['schedulingPolicy'] = schedulingPolicy;
    //updatedJson['schedulingPolicy'] = schedulingPolicy;
    setFrequency(intervalInput.value);
  });

  const repeatIntervalInput = document.getElementById('run-interval-input');
  repeatIntervalInput.addEventListener('change', function (event) {
    repeatIntervalInSeconds = repeatIntervalInput.value * 60;
    //jsonData['repeatIntervalInSeconds'] = repeatIntervalInSeconds;
    //updatedJson['repeatIntervalInSeconds'] = repeatIntervalInSeconds;
    setFrequency(intervalInput.value);
  });

  const batchIntervalInput = document.getElementById('batch-interval-input');
  batchIntervalInput.addEventListener('change', function (event) {
    batchIntervalInSeconds = batchIntervalInput.value * 60;
    //jsonData['batchIntervalInSeconds'] = batchIntervalInSeconds;
    //updatedJson['batchIntervalInSeconds'] = batchIntervalInSeconds;
    setFrequency(intervalInput.value);
  });

  const intervalInput = document.getElementById('interval-radio');
  intervalInput.addEventListener('change', function (event) {
    setFrequency(intervalInput.value);
  });

  const runonceInput = document.getElementById('runonce-radio');
  runonceInput.addEventListener('change', function (event) {
    setFrequency(runonceInput.value);
  });

  // script
  const scriptInput = document.getElementById('script-id-input');
  scriptInput.addEventListener('change', function (event) {
    const sid = scriptInput.options[scriptInput.selectedIndex].value;
    const selId = (sid === undefined || sid === '-1') ? "" : sid;
    var scriptError = validateScript(selId, MON_TYPE);
    if (scriptError) {
      showError(errorIds[1]);
      return;
    }

    hideError(errorIds[1]);
    scriptId = scriptInput.options[scriptInput.selectedIndex].value;
    jsonData['scriptId'] = scriptId;
    updatedJson['scriptId'] = scriptId;
  });

  const scriptParamInput = document.getElementById('script-param-input');
  scriptParamInput.addEventListener('change', function (event) {
    let sparams = scriptParamInput.value;
    if (sparams) {
      try {
        scriptParameters = JSON.parse(sparams);
        hideError('script-param-error');
      } catch (e) {
        showError('script-param-error');
        return;
      }
      //jsonData['scriptParameters'] = scriptParameters;
    } else {
      scriptParameters = null;
    }
    jsonData['scriptParameters'] = scriptParameters;
    updatedJson['scriptParameters'] = scriptParameters;
  });

  const selectedVpObj = document.getElementById('vantage-point-input');
  selectedVpObj.addEventListener('change', function (event) {
    var selectedOpts = Array.from(selectedVpObj.selectedOptions);
    const vps = selectedOpts.map(option => option.value);
    var vpError = validateVPs(vps);
    if (vpError) {
      showError(errorIds[2]);
      return;
    }

    hideError(errorIds[2]);
    var selectedOpts = Array.from(selectedVpObj.selectedOptions);
    vantagePoints = selectedOpts.map(option => option.value);
    jsonData['vantagePoints'] = vantagePoints;
    updatedJson['vantagePoints'] = vantagePoints;
  });

  const timeoutInput = document.getElementById('timeout-min-input'); // in minutes
  timeoutInput.addEventListener('change', function (event) {
    timeoutInSeconds = timeoutInput.value;
    jsonData['timeoutInSeconds'] = timeoutInSeconds * 60;
    updatedJson['timeoutInSeconds'] = timeoutInSeconds * 60;
  });

  /** optional fields -- start **/

  const screenshotCheckbox = document.getElementById('enable-screenshot-checkbox');
  screenshotCheckbox.addEventListener('change', function (event) {
    isDefaultSnapshotEnabled = screenshotCheckbox.checked;
    jsonData['isDefaultSnapshotEnabled'] = isDefaultSnapshotEnabled;
    updatedJson['isDefaultSnapshotEnabled'] = isDefaultSnapshotEnabled;
  });

  const sslCheckbox = document.getElementById('verify-ssl-checkbox');
  sslCheckbox.addEventListener('change', function (event) {
    isCertificateValidationEnabled = sslCheckbox.checked;
    jsonData['isCertificateValidationEnabled'] = isCertificateValidationEnabled;
    updatedJson['isCertificateValidationEnabled'] = isCertificateValidationEnabled;
  });

  const retryCheckbox = document.getElementById('enable-retry-checkbox');
  retryCheckbox.addEventListener('change', function (event) {
    isFailureRetried = retryCheckbox.checked;
    jsonData['isFailureRetried'] = isFailureRetried;
    updatedJson['isFailureRetried'] = isFailureRetried;
  });

  // dns override
  const dnsIpInput = document.getElementById('override-dns-input');
  dnsIpInput.addEventListener('change', function (event) {
    setDnsConfig(dnsIpInput);
  });

  const dnsCheckbox = document.getElementById('override-dns-checkbox');
  dnsCheckbox.addEventListener('change', function (event) {
    isOverrideDns = dnsCheckbox.checked;
    if (isOverrideDns) {
      document.getElementById('override-dns-input').style.display = 'block';
    } else {
      document.getElementById('override-dns-input').style.display = 'none';
    }
    setDnsConfig(dnsIpInput); //calling it again to override previous values
    //console.log('on change - overrideDnsIp : ' + overrideDnsIp);
  });

  function setDnsConfig() {
    if (isOverrideDns) {
      dnsConfiguration = JSON.parse('{}');
      overrideDnsIp = dnsIpInput.value;
      dnsConfiguration['isOverrideDns'] = isOverrideDns;
      dnsConfiguration['overrideDnsIp'] = overrideDnsIp;
      //console.log('dnsIps : ' + overrideDnsIp);
    } else {
      dnsConfiguration = null;
    }
    jsonData["dnsConfiguration"] = dnsConfiguration;
    updatedJson["dnsConfiguration"] = dnsConfiguration;
  }

  // network config
  function setNetworkConfig() {
    //console.log('edit (setNetworkConfig), isNetwork : ' + isNetwork);
    if (isNetwork) {
      networkConfiguration = JSON.parse('{}');
      protocolOpt = protocolBox.options[protocolBox.selectedIndex].value;
      probePerHop = document.getElementById('hop-input').value;
      //console.log('edit (setNetworkConfig) protocolOpt : ' + protocolOpt);
      if (protocolOpt === 'ICMP') {
        probeMode = null;
      } else { //tcp
        probeMode = probeInput.options[probeInput.selectedIndex].value;
      }
      networkConfiguration['protocol'] = protocolOpt;
      networkConfiguration['probeMode'] = probeMode; // only for tcp
      networkConfiguration['probePerHop'] = probePerHop;
      networkConfiguration['numberOfHops'] = 30;
      networkConfiguration['transmissionRate'] = 16;

    } else { // network else
      probePerHop = null;
      probeMode = null;
      protocolOpt = null;
      networkConfiguration = null;
    }
    jsonData['networkConfiguration'] = networkConfiguration;
    updatedJson['networkConfiguration'] = networkConfiguration;
  }
  const probeInput = document.getElementById("probe-input"); //syn/sack -- tcp
  probeInput.addEventListener('change', function (event) {
    isNetwork = networkCheckbox.checked;
    probeMode = probeInput.options[probeInput.selectedIndex].value;
    //console.log('edit probeMode : ' + probeMode);
    setNetworkConfig();
  });

  const protocolBox = document.getElementById('protocol-input'); //tcp/icmp
  protocolBox.addEventListener('change', function (event) {
    isNetwork = networkCheckbox.checked;
    protocolOpt = protocolBox.options[protocolBox.selectedIndex].value;
    //console.log('edit protocolOpt : ' + protocolOpt);
    if (protocolOpt === 'ICMP') {
      document.getElementById('probe-div').style.display = 'none';
    } else {
      document.getElementById('probe-div').style.display = 'block';
    }
    setNetworkConfig();
  });

  const networkCheckbox = document.getElementById('enable-network-checkbox');
  networkCheckbox.addEventListener('change', function (event) {
    isNetwork = networkCheckbox.checked;
    //console.log('edit isNetwork : ' + isNetwork);
    if (isNetwork) {
      document.getElementById('network-collection-div').style.display = 'block';
      if (protocolOpt === 'ICMP') {
        document.getElementById('probe-div').style.display = 'none';
      } else { //tcp
        document.getElementById('probe-div').style.display = 'block';
      }
    } else { // network else
      document.getElementById('network-collection-div').style.display = 'none';
    }
    setNetworkConfig(); // calling it again to override previous values
  });

  // availability config
  function setAvailabilityConfig() {
    if (isAvailability) {
      availabilityConfiguration = JSON.parse('{}');
      maxAllowedFailuresPerInterval = failureInput.value;
      minAllowedRunsPerInterval = runInput.value;
      availabilityConfiguration['maxAllowedFailuresPerInterval'] = maxAllowedFailuresPerInterval;
      availabilityConfiguration['minAllowedRunsPerInterval'] = minAllowedRunsPerInterval;
    } else {
      availabilityConfiguration = null;
    }
    jsonData['availabilityConfiguration'] = availabilityConfiguration;
    updatedJson['availabilityConfiguration'] = availabilityConfiguration;
    //console.log('edit (setAvailabilityConfig) maxAllowedFailuresPerInterval : ' + maxAllowedFailuresPerInterval);
  }

  const failureInput = document.getElementById("max-failures-input");
  failureInput.addEventListener('change', function (event) {
    isAvailability = availabilityCheckbox.checked;
    maxAllowedFailuresPerInterval = failureInput.value;
    //console.log('edit maxAllowedFailuresPerInterval : ' + maxAllowedFailuresPerInterval);
    setAvailabilityConfig();
  });

  const runInput = document.getElementById("min-runs-input");
  runInput.addEventListener('change', function (event) {
    isAvailability = availabilityCheckbox.checked;
    minAllowedRunsPerInterval = runInput.value;
    //console.log('edit minAllowedRunsPerInterval : ' + minAllowedRunsPerInterval);
    setAvailabilityConfig();
  });

  const availabilityCheckbox = document.getElementById('enable-availability-checkbox');
  availabilityCheckbox.addEventListener('change', function (event) {
    isAvailability = availabilityCheckbox.checked;
    if (isAvailability) {
      availabilityConfiguration = JSON.parse('{}');
      document.getElementById('availability-div').style.display = 'block';
      maxAllowedFailuresPerInterval = document.getElementById('max-failures-input').value;
      minAllowedRunsPerInterval = document.getElementById('min-runs-input').value;
      availabilityConfiguration['maxAllowedFailuresPerInterval'] = maxAllowedFailuresPerInterval;
      availabilityConfiguration['minAllowedRunsPerInterval'] = minAllowedRunsPerInterval;
    } else {
      document.getElementById('enable-availability-checkbox').checked = false;
      document.getElementById('availability-div').style.display = 'none';
      availabilityConfiguration = null;
    }
    jsonData['availabilityConfiguration'] = availabilityConfiguration;
    updatedJson['availabilityConfiguration'] = availabilityConfiguration;
    //console.log('maxAllowedFailuresPerInterval : ' + maxAllowedFailuresPerInterval);
  });

  const definedTagsInput = document.getElementById('defined-tags-input');
  definedTagsInput.addEventListener('change', function (event) {
    let tags = definedTagsInput.value;
    if (tags) {
      try {
        definedTags = JSON.parse(tags);
        hideError('defined-tags-error');
      } catch (e) {
        showError('defined-tags-error');
        return;
      }
    } else {
      definedTags = null;
    }
    jsonData['definedTags'] = definedTags;
    updatedJson['definedTags'] = definedTags;
  });

  const freeformTagsInput = document.getElementById('freeform-tags-input');
  freeformTagsInput.addEventListener('change', function (event) {
    let tags = freeformTagsInput.value;
    if (tags) {
      try {
        freeformTags = JSON.parse(tags);
        hideError('freeform-tags-error');
      } catch (e) {
        showError('freeform-tags-error');
        return;
      }
    } else {
      freeformTags = null;
    }
    jsonData['freeformTags'] = freeformTags;
    updatedJson['freeformTags'] = freeformTags;
  });

  /** optional fields -- END **/

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

        document.getElementById('file-text-input').value = JSON.stringify(jsonData, null, '\t') || '';
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
    //hide previous error 
    // if (editType === "ui") {
    //   hideErrors();
    //   //validate form inputs
    //   if (isValidateForm() === false) {
    //     return;
    //   }
    // }
    hideErrors();
    if (isValidateJsonFileForm() === false) {
      return;
    }

    // Post a message to the extension when the save button is clicked
    vscode.postMessage({
      command: 'save_as_json',
      monitorName: displayName,
      monitorJson: jsonData
    });
  });

  const editButton = document.getElementById('edit-button');
  editButton.addEventListener('click', () => {
    //hide previous error 
    // if (editType === "ui") {
    //   hideErrors();
    //   //validate form inputs
    //   if (isValidateForm() === false) {
    //     return;
    //   }
    // }
    hideErrors();
    if (isValidateJsonFileForm() === false) {
      return;
    }
    // Post a message to the extension when the Create button is clicked
    vscode.postMessage({
      command: 'edit_monitor',
      apmDomainId: apmDomainId,
      monitorId: monitorId,
      monitorJson: updatedJson
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
      //console.log('submit form json ... ' + JSON.stringify(jsonData));
      //form.submit(); // default form submit
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
      } catch (e) {
        return ErrorJson.validation.jsonFile.invalidJson;
      }
    } else {
      return ErrorJson.validation.jsonFile.empty;
    }
  };

  const validateDisplayName = (displayName) => {
    if (displayName) {
      return displayName.length > 255 ? ErrorJson.validation.displayName.lengthy :
        (/\s/.test(displayName)) ? ErrorJson.validation.displayName.spaceNotAllowed :
          !(/^[a-zA-Z_](-?[a-zA-Z_0-9])*$/.test(displayName)) ?
            ErrorJson.validation.displayName.invalidName : '';
    } else {
      return ErrorJson.validation.displayName.empty;
    }
  };

  const validateMonitorType = (type) => {
    if (type === "" || type !== MON_TYPE) {
      return ErrorJson.validation.type.empty;
    }
  };

  const validateBaseUrl = (url, type) => {
    if (!url && type !== MON_TYPE) {
      ErrorJson.validation.target.empty;
    }
    // Check if target has protocol in correct format. 
    if (url && (type === MON_TYPE) && !((/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//).test(url))) {
      return ErrorJson.validation.target.invalidProtocolFormat;
    }
  };

  const validateScript = (script, type) => {
    if (!script && type === MON_TYPE) {
      return ErrorJson.validation.script.empty;
    }
  };

  const validateScriptParams = (params) => {
    let error;
    if (params && params.length !== 0 && !validateJSON(params)) {
      error = ErrorJson.validation.scriptParameters.invalidJson;
    }
    return error;
  };

  const validateDefinedTags = (params) => {
    let error;
    if (params && params.length !== 0 && !validateJSON(params)) {
      error = ErrorJson.validation.definedTags.invalidJson;
    }
    return error;
  };

  const validateFreeformTags = (params) => {
    let error;
    if (params && params.length !== 0 && !validateJSON(params)) {
      error = ErrorJson.validation.freeformTags.invalidJson;
    }
    return error;
  };

  const validateVPs = (VPNames) => {
    if (VPNames && VPNames.length) {
      return VPNames.length > VP_LIMIT ?
        ErrorJson.validation.vantagePoints.limited : undefined;
    } else {
      return ErrorJson.validation.vantagePoints.empty;
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

  function empty(str) {
    return (!str || str.length === 0);
  }

  function emptyJson(str) {

  }


  function isValidateJsonFileForm() {
    let isValid = true;
    var jsonError = validateJsonFile(jsonTextInput);
    if (jsonError) {
      document.getElementById('file-text-error').innerHTML = jsonError;
      showError('file-text-input-error');
      isValid = false;
    }

    return isValid;
  }

  function isValidateForm() {
    let isValid = true;
    var nameError = validateDisplayName(displayName);
    if (nameError) {
      document.getElementById('monitor-error-text').innerHTML = nameError;
      showError(errorIds[0]);
      isValid = false;
    }

    const sid = scriptInput.options[scriptInput.selectedIndex].value;
    const selId = (sid === undefined || sid === '-1') ? "" : sid;
    var scriptError = validateScript(selId, MON_TYPE);
    if (scriptError) {
      showError(errorIds[1]);
      isValid = false;
    }

    var selectedOpts = Array.from(selectedVpObj.selectedOptions);
    const vps = selectedOpts.map(option => option.value);
    var vpError = validateVPs(vps);
    if (vpError) {
      showError(errorIds[2]);
      isValid = false;
    }

    var targetError = validateBaseUrl(targetInput.value, 'SCRIPTED_BROWSER');
    if (targetError) {
      document.getElementById('target-error-text').innerHTML = targetError;
      showError('target-error');
      isValid = false;
    }

    var scriptParamError = validateScriptParams(scriptParamInput.value);
    if (scriptParamError) {
      showError('script-param-error');
      isValid = false;
    }

    var definedTagsError = validateDefinedTags(definedTagsInput.value);
    if (definedTagsError) {
      showError('defined-tags-error');
      isValid = false;
    }

    var freeformTagsError = validateFreeformTags(freeformTagsInput.value);
    if (freeformTagsError) {
      showError('freeform-tags-error');
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
