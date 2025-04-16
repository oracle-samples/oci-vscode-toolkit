/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

export function getRepoNamefromRepoUrl(url: string) {
    const startIndex = url.lastIndexOf("/") + 1;
    if (url.endsWith('.git')) {
        return url.substring(startIndex, url.length - 4);
    } else {
        return url.substring(startIndex);
    }
}
