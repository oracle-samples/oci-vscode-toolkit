/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as path from 'path';

import { runTests } from 'vscode-test';

async function main() {
    try {
        const extensionDevelopmentPath = path.resolve(__dirname, '../../../');
        const extensionTestsPath = path.resolve(__dirname, './suite');
        await runTests({ extensionDevelopmentPath, extensionTestsPath });
    } catch (err) {
        console.error('Failed to run tests: ', err);
        process.exit(1);
    }
}

main();
