/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 import * as nls from 'vscode-nls';

 const localize: nls.LocalizeFunc = nls.loadMessageBundle();
 
// throws an error if string is empty
export function throwIfEmpty(s: string, name: string) {
    if (s.trim() === '') {
        const errorMsg = localize("emptyNameMsg", "{0} cannot be empty",name);
        throw new Error(errorMsg);
    }
}

// returns true if string is empty (e.g. '')
function isEmpty(s: string): boolean {
    return s?.trim() === '';
}

// returns true if string includes spaces (e.g. 'hello space')
function hasSpaces(s: string): boolean {
    return s.includes(' ');
}

// TODO: what if profile already exists?
export function validateProfileName(str: string) {
    if (isEmpty(str) || hasSpaces(str)) {
        const errorMsg = localize("validProfileNameMsg", "You must provide a valid profile name");
        return errorMsg;
    }
    return undefined;
}
