/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
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
        return 'You must provide a valid field name';
    }
    return undefined;
}

export function validateApplicationName(str: string): string | undefined {
    if (isEmpty(str)) {
        return 'You must provide a valid application name';
    }
    return undefined;
}

// validates the function name
export function validateFunctionName(str: string): string | undefined {
    if (isEmpty(str) || hasSpaces(str)) {
        return 'You must provide a valid function name';
    }
    return undefined;
}
