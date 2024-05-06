/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

export function isZipFile(filePath: string) {
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    return fileExtension === "zip" || fileExtension === "gz";
}

export function isScriptFile(path: string) {
    path = path.toLocaleLowerCase();
    return path.endsWith('.sh') || path.endsWith('.bash') || path.endsWith('.py');
}
