/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

export const SCRIPT_CONTENT_TYPE_SIDE = "SIDE";
export const SCRIPT_CONTENT_EXT_SIDE = ".side";
export const SCRIPT_CONTENT_TYPE_TS = "PLAYWRIGHT_TS";
export const SCRIPT_CONTENT_EXT_TS = ".ts";
export const SCRIPT_CONTENT_EXT_SPEC_TS = ".spec.ts";
export const SCRIPT_CONTENT_TYPE_JS = "JS";
export const SCRIPT_CONTENT_EXT_JS = ".js";

export const SYNTHETIC_CUSTOM_MARKER_COMMAND = "oraSynCustomMarker";
export const SYNTHETIC_CUSTOM_SCREENSHOT_COMMAND = "oraSynCustomScreenshot";
export const SYNTHETIC_TIME_BASED_OTP_COMMAND = "oraSynTimeBasedOTP";
export const SYNTHETIC_CUSTOM_MARKER_COUNT = 500;
export const SYNTHETIC_CUSTOM_SCREENSHOT_COUNT = 10;
export const _VALID_FILE_SIZE = 64; // KB
export const _VALID_SIDEFILE_VERSION_V2 = 2.0;
const _VALID_SIDEFILE_VERSION_V3 = 3.0;
export const _URL = "url";
export const _VERSION = "version";
export const _ID = "id";
export const _NAME = "name";
export const _TEST = "tests";
export const _SUITES = "suites";
export const _plugin = "plugins";
export const _urls = "urls";
export const _snapshot = "snapshot";

export const sideKeys_v2 = [_ID, _VERSION, _NAME, _URL, _TEST, _SUITES, _urls, _plugin];
export const sideKeys_v3 = [_ID, _VERSION, _NAME, _URL, _TEST, _SUITES, _urls, _plugin, _snapshot];

export const sideVersionsAndKeysMap = new Map();
sideVersionsAndKeysMap.set(_VALID_SIDEFILE_VERSION_V2, sideKeys_v2);
sideVersionsAndKeysMap.set(_VALID_SIDEFILE_VERSION_V3, sideKeys_v3);

export const cmdsWithoutTarget_v2 = ["open", "close", "store", "storeTitle", "answerOnNextPrompt", "chooseCancelOnNextConfirmation", "chooseCancelOnNextPrompt", "chooseOkOnNextConfirmation", "webdriverChooseOkOnVisibleConfirmation", "webdriverChooseCancelOnVisibleConfirmation", "webdriverChooseCancelOnVisiblePrompt", "else", "do", "end", "debugger"];
export const cmdsWithoutTarget_v3 = ["open", "close", "store", "storeTitle", "answerOnNextPrompt", "chooseCancelOnNextConfirmation", "chooseCancelOnNextPrompt", "chooseOkOnNextConfirmation", "webdriverChooseOkOnVisibleConfirmation", "webdriverChooseCancelOnVisibleConfirmation", "webdriverChooseCancelOnVisiblePrompt", "else", "do", "end", "debugger", "acceptAlert", "acceptConfirmation", "dismissConfirmation", "dismissPrompt"];

export const sideVersionsAndCmdsWithoutTargetMap = new Map();
sideVersionsAndCmdsWithoutTargetMap.set(_VALID_SIDEFILE_VERSION_V2, cmdsWithoutTarget_v2);
sideVersionsAndCmdsWithoutTargetMap.set(_VALID_SIDEFILE_VERSION_V3, cmdsWithoutTarget_v3);

export const POSTMAN_REQUEST_MODULE = "postman-request";
export const modules = new Set();
modules.add(POSTMAN_REQUEST_MODULE);
modules.add("util");
modules.add("oci-common");
modules.add("jsrsasign");

export const customOperations = new Set();

// Custom operations
customOperations.add("setValue");
customOperations.add("startTime");
customOperations.add("endTime");

