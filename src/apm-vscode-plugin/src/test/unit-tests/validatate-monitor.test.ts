/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { expect } from 'chai';
const {
    validateDisplayName, validateMonitorType, validateBaseUrl, validateScript,
    validateScriptParams, validateDefinedTags, validateFreeformTags, validateVPs, validateJSON
} = require('./../../validation/validator');


describe('Validating payload attributes and returning true or false', () => {
    const monitor = {
        displayName: "test-monitor", baseUrl: "https://oracle.com",
        script_ocid: "ocid1.apmsyntheticscript.oc1.phx.aaaaaaz3xxxxxxxxxxxxxxxxxxxxxxxxcrycq",
        script_name: "oci_login_1", vps: '["OraclePublic-ap-sydney-1","OraclePublic-ap-mumbai-1"]',
        definedTags: '{"apm-resource-capability":{"apm-syn-allow-s2s":"tag-value-1"}}', freeFormTags: "{}",
        script_params: '[{"paramName": "name1","paramValue": "value1"},{"paramName": "name2","paramValue": "value2"}]',
        monitorJson: {}
    };

    it('valid monitor payload: -> return true', () => {
        const status = validateDisplayName(monitor.displayName);
        var result = status === '';
        expect(result).to.equal(true);
    });

    // it('base url is not valid: invalid monitor payload -> return false', () => {
    //     monitor.baseUrl = "htps:oracle.com";
    //     const status = validateBaseUrl(monitor.baseUrl);
    //     expect(status).to.equal(undefined);
    // });

    // it('script name is empty: invalid monitor payload -> return false', () => {
    //     monitor.script_name = "";
    //     const status = validateScript(monitor.script_name);
    //     expect(status).to.equal(undefined);
    // });

    it('script-params are not valid json: invalid monitor payload -> return false', () => {
        monitor.script_params = "parma1=value1";
        const status = validateScriptParams(monitor.script_params);
        expect(status).to.equal('Invalid script parameters json.');
    });

    it('vantage point is empty: invalid monitor payload -> return false', () => {
        monitor.vps = "";
        const status = validateVPs(monitor.vps);
        expect(status).to.equal('At least one vantage point is required.');
    });

    it('defined-tags are not valid json: invalid monitor payload -> return false', () => {
        monitor.definedTags = "parma1=value1";
        const status = validateDefinedTags(monitor.definedTags);
        expect(status).to.equal('Invalid defined tags json.');
    });

    it('freeform-tags are not valid json: invalid monitor payload -> return false', () => {
        monitor.freeFormTags = "parma1=value1";
        const status = validateFreeformTags(monitor.freeFormTags);
        expect(status).to.equal('Invalid freeform tags json.');
    });

});
