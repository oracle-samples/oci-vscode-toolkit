"use strict";
/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJSON = exports.validateVPs = exports.validateFreeformTags = exports.validateDefinedTags = exports.validateScriptParams = exports.validateScript = exports.validateBaseUrl = exports.validateMonitorType = exports.validateDisplayName = void 0;
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
const VP_LIMIT = 100;
function validateDisplayName(displayName) {
  if (displayName) {
    return displayName.length > 255 ? ErrorJson.validation.displayName.lengthy :
      (/\s/.test(displayName)) ? ErrorJson.validation.displayName.spaceNotAllowed :
        !(/^[a-zA-Z_](-?[a-zA-Z_0-9])*$/.test(displayName)) ?
          ErrorJson.validation.displayName.invalidName : '';
  }
  else {
    return ErrorJson.validation.displayName.empty;
  }
}
exports.validateDisplayName = validateDisplayName;
;

function validateBaseUrl(url, type) {
  if (!url) {
    ErrorJson.validation.target.empty;
  }
  // Check if target has protocol in correct format. 
  if (url && !((/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//).test(url))) {
    return ErrorJson.validation.target.invalidProtocolFormat;
  }
}
exports.validateBaseUrl = validateBaseUrl;
;
function validateScript(script, type) {
  if (!script) {
    return ErrorJson.validation.script.empty;
  }
}
exports.validateScript = validateScript;
;
function validateScriptParams(params) {
  let error;
  if (params && params.length !== 0 && !validateJSON(params)) {
    error = ErrorJson.validation.scriptParameters.invalidJson;
  }
  return error;
}
exports.validateScriptParams = validateScriptParams;
;
function validateDefinedTags(params) {
  let error;
  if (params && params.length !== 0 && !validateJSON(params)) {
    error = ErrorJson.validation.definedTags.invalidJson;
  }
  return error;
}
exports.validateDefinedTags = validateDefinedTags;
;
function validateFreeformTags(params) {
  let error;
  if (params && params.length !== 0 && !validateJSON(params)) {
    error = ErrorJson.validation.freeformTags.invalidJson;
  }
  return error;
}
exports.validateFreeformTags = validateFreeformTags;
;
function validateVPs(VPNames) {
  if (VPNames && VPNames.length) {
    return VPNames.length > VP_LIMIT ?
      ErrorJson.validation.vantagePoints.limited : undefined;
  }
  else {
    return ErrorJson.validation.vantagePoints.empty;
  }
}
exports.validateVPs = validateVPs;
;
function validateJSON(content) {
  try {
    JSON.parse(content);
    return true;
  }
  catch (e) {
    return false;
  }
}
exports.validateJSON = validateJSON;
;
//# sourceMappingURL=validator.js.map