/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { expect } from 'chai';
import { isPayloadValid } from '../payload-validator';

describe('Validating payload', () => {

    let listOfPayloads = [
        {
            title: 'valid payload',
            activation_type: "edit",
            compartment_ocid: "compartment_ocid",
            resource_ocid: "ocidresource",
            region_name: "us-ashburn-1",
            expectedResult: true
        },
        {
            title: 'region is empty:invalid payload',
            activation_type: "edit",
            compartment_ocid: "compartment_ocid",
            resource_ocid: "ocidresource",
            region_name: "",
            expectedResult: false
        },
        {
            title: 'compartmentId is empty:invalid payload',
            activation_type: "edit",
            compartment_ocid: "",
            resource_ocid: "ocidresource",
            region_name: "us-ashburn-1",
            expectedResult: false
        },
        {
            title: 'resourceId is empty:invalid payload',
            activation_type: "edit",
            compartment_ocid: "compartment_ocid",
            resource_ocid: "",
            region_name: "us-ashburn-1",
            expectedResult: false
        },
        {
            title: 'activation_type is empty:invalid payload',
            activation_type: "",
            compartment_ocid: "compartment_ocid",
            resource_ocid: "ocidresource",
            region_name: "us-ashburn-1",
            expectedResult: false
        }
    ];

    listOfPayloads.forEach(payload => {
        it(`${payload.title} -> return ${payload.expectedResult}`, () => {
            const status = isPayloadValid(payload);
            const failMessage = `Payload validation should return ${payload.expectedResult} for ${payload.title}`;
            expect(status, failMessage).to.equal(payload.expectedResult);
        });
    });
});
