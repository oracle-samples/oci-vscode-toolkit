/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as jwtDecode from 'jwt-decode';

interface JwtToken {
    exp: number;
}

// checks whether jwt token has expired or not.
export function isTokenExpired(token: string): boolean {
    const decodedToken: JwtToken = jwtDecode(token);
    // exp is in seconds and Date.now() is in miliseconds
    // use * 1000 to get the miliseconds
    if (Date.now() < decodedToken.exp * 1000) {
        // No need to refresh, as token hasn't expired yet.
        return false;
    }
    return true;
}
