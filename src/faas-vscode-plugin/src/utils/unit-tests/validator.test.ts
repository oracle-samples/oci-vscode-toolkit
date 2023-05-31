/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as assert from 'assert';
import { hasSpaces, hasUppercase } from '../validators';
import { validateApplicationName } from "../validators";

describe('Validators Test Suite', () => {
    it('test hasSpaces', () => {
        const testData = [
            {
                input: 'nospace',
                expected: false,
            },
            {
                input: 'Has space',
                expected: true,
            },
        ];
        testData.forEach((t) => {
            const actual = hasSpaces(t.input);
            assert.strictEqual(actual, t.expected);
        });
    });

    it('test hasUpperCase', () => {
        const testData = [
            {
                input: 'UPPERcase',
                expected: true
            },
            {
                input: 'lowercase',
                expected: false
            }
        ];
        testData.forEach((t) => {
            const actual = hasUppercase(t.input);
            assert.strictEqual(actual, t.expected);
        });
    });

    it('test validateApplicationName', () => {
        const testData = [
            {
                input: 'MyApplicatonName',
                expected: undefined
            },
            {
                input: "",
                expected: "You must provide a valid application name"
            },
            {
                input: "My application Name",
                expected: undefined
            }
        ];
        testData.forEach((t) => {
            const actual = validateApplicationName(t.input);
            assert.strictEqual(actual, t.expected);
        });
    });
});
