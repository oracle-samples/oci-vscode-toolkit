/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as assert from 'assert';
import { hasSpaces, hasUppercase, validateMonitorName } from '../validators';

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

    it('test validateMonitorName', () => {
        const testData = [
            {
                input: 'TestSynMonitorName',
                expected: undefined
            },
            {
                input: " ",
                expected: "You must provide a valid monitor name"
            },
            {
                input: "My monitor Name",
                expected: "You must provide a valid monitor name"
            }
        ];
        testData.forEach((t) => {
            const actual = validateMonitorName(t.input);
            assert.strictEqual(actual, t.expected);
        });
    });
});
