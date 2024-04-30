/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 import * as nls from 'vscode-nls';

 const localize: nls.LocalizeFunc = nls.loadMessageBundle();
// returns true if string contains uppercase characters
export function hasUppercase(s: string): boolean {
    return (/[A-Z]/.test(s));
}

// returns true if string is empty (e.g. '')
export function isEmpty(s: string): boolean {
    return s?.trim() === '';
}

// returns true if string includes spaces (e.g. 'hello space')
export function hasSpaces(s: string): boolean {
    return s.includes(' ');
}

export function getSecondPart(str: String) {
    return str.split('-')[1];
}

export function validateFieldName(str: string) {
    if (isEmpty(str) || hasSpaces(str)) {
        const errorMsg = localize("validFieldNameErrorMsg","You must provide a valid field name");
        return errorMsg;
    }
    return undefined;
}

export function titleCase(str: string) {
    return str.toLowerCase().split(' ').map(function(word) {
      return word.replace(word[0], word[0].toUpperCase());
    }).join(' ');
  }
