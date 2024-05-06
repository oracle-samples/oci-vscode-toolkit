/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { expect } from 'chai';
import { isPayloadValid } from '../launchPayload';

describe('Validating payload attributes and returning true or false', () => {
    const payload = {
        action: "LAUNCH_CODE_EDITOR", plugin_name: "faas", activation_type: "create",
        compartment_ocid: "compartment_ocid",
        region_name: "us-ashburn-1", resource_ocid: "ocidresource"
    };

    it('valid payload: -> return true', () => {
        const status = isPayloadValid(payload);
        expect(status).to.equal(true);
    });

    it('region is empty:invalid payload -> return false', () => {
        payload.region_name = "";
        const status = isPayloadValid(payload);
        expect(status).to.equal(false);
    });

    it('compartmentId is empty:invalid payload -> return false', () => {
        payload.compartment_ocid = "";
        const status = isPayloadValid(payload);
        expect(status).to.equal(false);
    });

    it('resourceId is empty:invalid payload -> return false', () => {
        payload.resource_ocid = "";
        const status = isPayloadValid(payload);
        expect(status).to.equal(false);
    });

    it('activation_type is empty:invalid payload -> return false', () => {
        payload.activation_type = "";
        const status = isPayloadValid(payload);
        expect(status).to.equal(false);
    });
});
