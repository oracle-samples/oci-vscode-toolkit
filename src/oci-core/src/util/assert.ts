/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

function assert(value: unknown, msg: string = ''): asserts value {
    if (value === undefined) {
        const errorMsg = localize("assertErrorMsg", "assert: value must be defined: {0}",msg);
        throw new Error(errorMsg);
    }
}

export default assert;
