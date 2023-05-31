/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { assert } from 'chai';
import { it, describe } from 'mocha';
import { getRepoNamefromRepoUrl } from "../parse-git-url";

describe('Validate Repo Name returned from Repo URl', () => {
    const tests = [
        { args: 'https://github.com/userName/fnsampledeploy.git', expected: 'fnsampledeploy' },
        { args: 'https://github.com/userName/fnsampledeploy', expected: 'fnsampledeploy' },
    ];

    tests.forEach(({ args, expected }) => {
        it(`correctly return repo name from repo url`, function () {
            const res = getRepoNamefromRepoUrl(args);
            assert.strictEqual(res, expected);
        });
    });
});
