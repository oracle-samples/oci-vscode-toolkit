/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function () {

  const vscode = acquireVsCodeApi();
  const errorIds = ['monitor-error', 'script-error', 'vp-error'];
  const VP_LIMIT = 100;

  let jsonData = document.getElementById('file-text-input').value;
  const apmDomainId = document.getElementById('apmdomain-id-input').value;

  let jsonTextInput = document.getElementById('file-text-input').value;
  let createType;
  let monitorType = "";
  let displayName;
  let vantagePoints;
  let target;
  let scriptId;
  let repeatIntervalInSeconds = 600;
  let timeoutInSeconds = 180;
  let scriptParameters;
  let isCertificateValidationEnabled;
  let isDefaultSnapshotEnabled;
  let isFailureRetried;
  let dnsConfiguration;
  let isOverrideDns;
  let overrideDnsIp;
  let networkConfiguration;
  let isNetwork;
  let probePerHop;
  let probeMode; // tcp/icmp
  let protocolOpt; // syn/sack - tcp
  let availabilityConfiguration;
  let isAvailability;
  let maxAllowedFailuresPerInterval;
  let minAllowedRunsPerInterval;
  let schedulingPolicy;
  let batchIntervalInSeconds;
  let definedTags;
  let freeformTags;

  // populate default values
  // jsonData['apmDomainId'] = apmDomainId;
  // jsonData['monitorType'] = monitorType;
  // jsonData['configType'] = configType;
  // jsonData['isRunOnce'] = isRunOnce;
  // jsonData['isRunNow'] = isRunNow;
  // jsonData['timeoutInSeconds'] = timeoutInSeconds;
  // jsonData['status'] = status;
  // jsonData['isRunNow'] = isRunNow;
  // jsonData['repeatIntervalInSeconds'] = repeatIntervalInSeconds;
  // jsonData['definedTags'] = definedTags;
  // jsonData['freeformTags'] = freeformTags;

  /** create using - START **/

  function createFrom(createType) {
    if (createType === 'ui') {
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
    createType = createFileInput.value;
    createFrom(createType);
  });

  const createUiInput = document.getElementById('from-ui-radio');
  createUiInput.addEventListener('change', function (event) {
    createTypze = createUiInput.value;
    createFrom(createType);
  });

  /** create using - END **/

  /** Required fields **/
  const fileTextInput = document.getElementById('file-text-input');
  fileTextInput.addEventListener('change', function (event) {
    jsonTextInput = editor.getValue();//fileTextInput.value;
    var jsonError = validateJsonFile(jsonTextInput);
    if (jsonError) {
      document.getElementById('file-text-error').innerHTML = jsonError;
      showError('file-text-input-error');
      return;
    }
    hideError('file-text-input-error');
  });

  fileTextInput.addEventListener('input', function (event) {
    jsonTextInput = editor.getValue();//fileTextInput.value;
    var jsonError = validateJsonFile(jsonTextInput);
    if (jsonError) {
      document.getElementById('file-text-error').innerHTML = jsonError;
      showError('file-text-input-error');
      return;
    }
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

  // frequency
  function setFrequency(freqValue) {
    if (freqValue === 'interval') {
      document.getElementById('interval-div').style.display = 'block';
      isRunOnce = false;
      repeatIntervalInSeconds = repeatIntervalInput.value * 60;
      schedulingPolicy = scheduleInput.options[scheduleInput.selectedIndex].value;
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
  }

  const scheduleInput = document.getElementById('scheduling-input');
  scheduleInput.addEventListener('change', function (event) {
    schedulingPolicy = scheduleInput.options[scheduleInput.selectedIndex].value;
    jsonData['schedulingPolicy'] = schedulingPolicy;
    setFrequency(intervalInput.value);
  });

  const repeatIntervalInput = document.getElementById('run-interval-input');
  repeatIntervalInput.addEventListener('change', function (event) {
    repeatIntervalInSeconds = repeatIntervalInput.value * 60;
    jsonData['repeatIntervalInSeconds'] = repeatIntervalInSeconds;
    setFrequency(intervalInput.value);
  });

  const batchIntervalInput = document.getElementById('batch-interval-input');
  batchIntervalInput.addEventListener('change', function (event) {
    batchIntervalInSeconds = batchIntervalInput.value * 60;
    jsonData['batchIntervalInSeconds'] = batchIntervalInSeconds;
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
    var scriptError = validateScript(selId);
    if (scriptError) {
      showError(errorIds[1]);
      return;
    }

    hideError(errorIds[1]);
    scriptId = scriptInput.options[scriptInput.selectedIndex].value;
    jsonData['scriptId'] = scriptId;
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
      jsonData['scriptParameters'] = scriptParameters;
    } else {
      scriptParameters = null;
    }
    jsonData['scriptParameters'] = scriptParameters;
  });

  //$('#vantage-point-input option:selected').prependTo('#vantage-point-input');

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
    vantagePoints = selectedOpts.map(option => option.value);
    jsonData['vantagePoints'] = vantagePoints;
  });

  const timeoutInput = document.getElementById('timeout-min-input'); // in minutes
  timeoutInput.addEventListener('change', function (event) {
    timeoutInSeconds = timeoutInput.value;
    jsonData['timeoutInSeconds'] = timeoutInSeconds * 60;
  });

  /** optional fields -- start **/

  const screenshotCheckbox = document.getElementById('enable-screenshot-checkbox');
  screenshotCheckbox.addEventListener('change', function (event) {
    isDefaultSnapshotEnabled = screenshotCheckbox.checked;
    jsonData['isDefaultSnapshotEnabled'] = isDefaultSnapshotEnabled;
  });

  const sslCheckbox = document.getElementById('verify-ssl-checkbox');
  sslCheckbox.addEventListener('change', function (event) {
    isCertificateValidationEnabled = sslCheckbox.checked;
    jsonData['isCertificateValidationEnabled'] = isCertificateValidationEnabled;
  });

  const retryCheckbox = document.getElementById('enable-retry-checkbox');
  retryCheckbox.addEventListener('change', function (event) {
    isFailureRetried = retryCheckbox.checked;
    jsonData['isFailureRetried'] = isFailureRetried;
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
  });

  function setDnsConfig() {
    if (isOverrideDns) {
      dnsConfiguration = JSON.parse('{}');
      overrideDnsIp = dnsIpInput.value;
      dnsConfiguration['isOverrideDns'] = isOverrideDns;
      dnsConfiguration['overrideDnsIp'] = overrideDnsIp;
    } else {
      dnsConfiguration = null;
    }
    jsonData["dnsConfiguration"] = dnsConfiguration;
  }

  // network config
  function setNetworkConfig() {
    if (isNetwork) {
      networkConfiguration = JSON.parse('{}');
      protocolOpt = protocolBox.options[protocolBox.selectedIndex].value;
      probePerHop = document.getElementById('hop-input').value;
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
  }
  const probeInput = document.getElementById("probe-input"); //syn/sack -- tcp
  probeInput.addEventListener('change', function (event) {
    isNetwork = networkCheckbox.checked;
    probeMode = probeInput.options[probeInput.selectedIndex].value;
    setNetworkConfig();
  });

  const protocolBox = document.getElementById('protocol-input'); //tcp/icmp
  protocolBox.addEventListener('change', function (event) {
    isNetwork = networkCheckbox.checked;
    protocolOpt = protocolBox.options[protocolBox.selectedIndex].value;
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
  }

  const failureInput = document.getElementById("max-failures-input");
  failureInput.addEventListener('change', function (event) {
    isAvailability = availabilityCheckbox.checked;
    maxAllowedFailuresPerInterval = failureInput.value;
    setAvailabilityConfig();
  });

  const runInput = document.getElementById("min-runs-input");
  runInput.addEventListener('change', function (event) {
    isAvailability = availabilityCheckbox.checked;
    minAllowedRunsPerInterval = runInput.value;
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
  });

  /** optional fields -- END **/

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
      vantagePoint: vantagePoints,
      monitorName: displayName,
      target: target,
      scriptId: scriptId,
      monitorJson: jsonData,
      status: status
    });
  });

  const createButton = document.getElementById('create-button');
  createButton.addEventListener('click', () => {
    hideErrors();
    if (isValidateJsonFileForm() === false) {
      return;
    }

    // add 'source=apm-availability-vs' as freeform tag in create api call, api will emit metrics for this field
    var freeformData = jsonData['freeformTags'];
    if (freeformData && freeformData.length !== 0) {
      freeformData['source'] = 'apm-availability-vs';
    } else {
      freeformData = JSON.parse('{}');
      freeformData['source'] = 'apm-availability-vs';
    }
    jsonData['freeformTags'] = freeformData;

    // Post a message to the extension when the Create button is clicked
    vscode.postMessage({
      command: 'create_monitor',
      vantagePoint: vantagePoints,
      monitorName: displayName,
      target: target,
      scriptId: scriptId,
      monitorJson: jsonData
    });
  });
  /** Event : submit form -- END */

  $("#form_create_monitor").validate({
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
    submitHandler: function (form) {
      return false;
    }
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

  // loadFromJsonInputsButton.addEventListener('change', function (event) {
  //   const file = event.target.files[0];
  //   if (file) {
  //     document.getElementById('form-buttons').style.display = 'block';
  //     document.getElementById('col1-div').style.display = 'block';
  //     document.getElementById('col2-div').style.display = 'block';
  //     const reader = new FileReader();
  //     reader.onload = function () {
  //       jsonData = JSON.parse(reader.result);
  //       //set apm domain for cli usability
  //       const apmDomainId = document.getElementById('apmdomain-id-input').value;
  //       jsonData['apmDomainId'] = apmDomainId;

  //       /** Read JSON data -- START **/
  //       monitorType = jsonData['monitorType'];
  //       if (monitorType !== MON_TYPE) {
  //         let errMsg = localize('incorrectMonitorType', 'Incorrect monitor type, supported value is : {0}', MonitorTypes?.ScriptedBrowser.toString());
  //         throw new Error(errMsg);
  //       }
  //       displayName = jsonData['displayName'];
  //       vantagePoints = jsonData['vantagePoints'];
  //       target = jsonData['target'];
  //       scriptId = jsonData['scriptId'];
  //       status = jsonData['status'];
  //       repeatIntervalInSeconds = jsonData['repeatIntervalInSeconds'] || 600;
  //       isRunOnce = jsonData['isRunOnce'];
  //       isRunNow = jsonData['isRunNow'];
  //       timeoutInSeconds = jsonData['timeoutInSeconds'];
  //       scriptParameters = jsonData['scriptParameters'];
  //       isCertificateValidationEnabled = jsonData['isCertificateValidationEnabled'] || true;
  //       isDefaultSnapshotEnabled = jsonData['isDefaultSnapshotEnabled'] || true;
  //       isFailureRetried = jsonData['isFailureRetried'] || true;
  //       dnsConfiguration = jsonData['dnsConfiguration'];
  //       networkConfiguration = jsonData['networkConfiguration'];
  //       availabilityConfiguration = jsonData['availabilityConfiguration'];
  //       maintenanceWindowSchedule = jsonData['maintenanceWindowSchedule'];
  //       //schedulingPolicy = jsonData[''];
  //       //batchIntervalInSeconds = jsonData[''];

  //       /** update interval & scheduling policy **/
  //       //setFrequency(isRunOnce ? 'runonce' : 'interval'); // update Frequency section
  //       if (isRunOnce) {
  //         document.getElementById('runonce-radio').checked = true;
  //         document.getElementById('interval-radio').checked = false;
  //       } else {
  //         document.getElementById('interval-radio').checked = true;
  //         document.getElementById('runonce-radio').checked = false;

  //         schedulingPolicy = jsonData['schedulingPolicy'] || 'ALL';
  //         if (schedulingPolicy === 'BATCHED_ROUND_ROBIN') {
  //           document.getElementById('batch-div').style.display = 'block';
  //           batchIntervalInSeconds = jsonData['batchIntervalInSeconds'] || 60;
  //         } else {
  //           document.getElementById('batch-div').style.display = 'none';
  //         }
  //       }

  //       if (dnsConfiguration && dnsConfiguration !== undefined) {
  //         isOverrideDns = dnsConfiguration['isOverrideDns'];
  //         overrideDnsIp = dnsConfiguration['overrideDnsIp'];
  //       }

  //       if (networkConfiguration && networkConfiguration !== undefined) {
  //         numberOfHops = jsonData['numberOfHops'] || 30;
  //         probePerHop = networkConfiguration['probePerHop'] || 3;
  //         transmissionRate = jsonData['transmissionRate'] || 16;
  //         protocolOpt = networkConfiguration['protocol'] || 'TCP'; //tcp/icmp
  //         if (protocolOpt === 'TCP') {
  //           probeMode = networkConfiguration['probeMode'] || 'SYN'; // syn/sack
  //         }
  //         networkConfiguration['numberOfHops'] = numberOfHops;
  //         networkConfiguration['transmissionRate'] = transmissionRate;
  //       }

  //       if (availabilityConfiguration && availabilityConfiguration !== undefined) {
  //         maxAllowedFailuresPerInterval = availabilityConfiguration['maxAllowedFailuresPerInterval'] || 0;
  //         minAllowedRunsPerInterval = availabilityConfiguration['minAllowedRunsPerInterval'] || 1;
  //       }

  //       if (maintenanceWindowSchedule && maintenanceWindowSchedule !== undefined) {
  //         timeStarted = maintenanceWindowSchedule['timeStarted'];
  //         timeEnded = maintenanceWindowSchedule['timeEnded'];
  //       }
  //       isIPv6 = jsonData['isIpv6'];
  //       definedTags = jsonData['definedTags'];
  //       freeformTags = jsonData['freeformTags'];

  //       /** Read JSON data -- END **/

  //       /** Populate fields -- START **/
  //       document.getElementById('monitor-name-input').value = displayName || '';
  //       document.getElementById('target-input').value = target || '';
  //       document.getElementById('script-id-input').value = scriptId || '';
  //       if (scriptId && scriptParameters && scriptParameters !== undefined) {
  //         scriptParameters = JSON.stringify(scriptParameters);
  //         document.getElementById('script-param-input').value = scriptParameters;
  //       }
  //       var unselectedVps = document.getElementById('vantage-point-input');
  //       var selectedVps = vantagePoints;
  //       for (var i = 0; i < unselectedVps.options.length; i++) {
  //         unselectedVps.options[i].selected = selectedVps.indexOf(unselectedVps.options[i].value) >= 0;
  //       }

  //       /** optional fields -- start **/
  //       document.getElementById('timeout-min-input').value = timeoutInSeconds ? Math.round(timeoutInSeconds / 60) : 3;
  //       document.getElementById('verify-ssl-checkbox').checked = isCertificateValidationEnabled;
  //       document.getElementById('enable-screenshot-checkbox').checked = isDefaultSnapshotEnabled;

  //       if (isRunOnce) {
  //         document.getElementById('runonce-radio').checked = true;
  //         document.getElementById('interval-radio').checked = false;
  //         document.getElementById('interval-div').style.display = 'none';
  //       } else {
  //         document.getElementById('runonce-radio').checked = false;
  //         document.getElementById('interval-radio').checked = true;
  //         document.getElementById('interval-div').style.display = 'block';
  //         var scheduleInput = document.getElementById("scheduling-input");
  //         for (var option of scheduleInput.options) {
  //           if (option.value === schedulingPolicy) {
  //             option.selected = true;
  //           }
  //         }
  //         if (schedulingPolicy === 'BATCHED_ROUND_ROBIN') {
  //           document.getElementById('batch-interval-input').value = Math.round(batchIntervalInSeconds / 60);
  //           document.getElementById('batch-div').style.display = 'block';
  //         } else {
  //           document.getElementById('batch-div').style.display = 'none';
  //         }
  //         document.getElementById('run-interval-input').value = Math.round(repeatIntervalInSeconds / 60);
  //       }
  //       // dns override
  //       if (dnsConfiguration && isOverrideDns) {
  //         document.getElementById('override-dns-checkbox').checked = true;
  //         document.getElementById('override-dns-input').style.display = 'block';
  //         document.getElementById('override-dns-input').value = overrideDnsIp || '';
  //       } else {
  //         document.getElementById('override-dns-checkbox').checked = false;
  //         document.getElementById('override-dns-input').style.display = 'none';
  //         document.getElementById('override-dns-input').value = '';
  //       }

  //       // retry
  //       document.getElementById('enable-retry-checkbox').checked = isFailureRetried;

  //       // netowork-config
  //       if (networkConfiguration && networkConfiguration !== undefined) {
  //         document.getElementById('enable-network-checkbox').checked = true;
  //         document.getElementById('network-collection-div').style.display = 'block';
  //         //document.getElementById('protocol-input').selected = true;

  //         var protocolInput = document.getElementById("protocol-input"); //tcp/icmp
  //         for (var option of protocolInput.options) {
  //           if (option.value === protocolOpt) {
  //             option.selected = true;
  //           }
  //         }
  //         if (protocolOpt === 'ICMP') {
  //           document.getElementById('probe-div').style.display = 'none';
  //         } else { //tcp
  //           document.getElementById('probe-div').style.display = 'block';
  //           var probeInput = document.getElementById("probe-input");
  //           for (var option of probeInput.options) {
  //             if (option.value === probeMode) {
  //               option.selected = true;
  //             }
  //           }
  //         }
  //         document.getElementById('hop-input').value = probePerHop;
  //       } else { //network else
  //         document.getElementById('enable-network-checkbox').checked = false;
  //         document.getElementById('network-collection-div').style.display = 'none';
  //       }

  //       // availability config
  //       if (availabilityConfiguration && availabilityConfiguration !== undefined) {
  //         document.getElementById('enable-availability-checkbox').checked = true;
  //         document.getElementById('availability-div').style.display = 'block';
  //         document.getElementById('max-failures-input').value = maxAllowedFailuresPerInterval;
  //         document.getElementById('min-runs-input').value = minAllowedRunsPerInterval;
  //       } else {
  //         document.getElementById('enable-availability-checkbox').checked = false;
  //         document.getElementById('availability-div').style.display = 'none';
  //       }

  //       // tags && Object.keys(definedTags).length !== 0 ; && !isEmpty(freeformTags)
  //       if (definedTags && definedTags !== undefined) {
  //         document.getElementById('defined-tags-input').value = JSON.stringify(definedTags);
  //       }
  //       if (freeformTags && freeformTags !== undefined) {
  //         document.getElementById('freeform-tags-input').value = JSON.stringify(freeformTags);
  //       }
  //       /** optional fields -- END **/

  //       /** Populate fields -- START **/

  //     };
  //     reader.readAsText(file);
  //   } else {
  //     document.getElementById('form-buttons').style.display = 'none';
  //     document.getElementById('col1-div').style.display = 'none';
  //     document.getElementById('col2-div').style.display = 'none';
  //   }
  // });

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
        // add monitor type to avoid error case where this edit file can be saved as json and then used in create monitor flow
        if (jsonData['monitorType'] === undefined) {
          jsonData['monitorType'] = monitorType;
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

  const validateScript = (script) => {
    if (!script) {
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

  function isValidateJsonFileForm() {
    let isValid = true;
    jsonTextInput = editor.getValue();// fileTextInput.value;
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

  function isEmpty(obj) {
    for (var prop in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, prop)) {
        return false;
      }
    }
    return true;
  }
});
