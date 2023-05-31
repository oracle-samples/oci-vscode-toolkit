/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
export interface IActionResult {
    canceled: boolean;
    error: boolean;
    result: any;
}

export function hasFailed(res: IActionResult): boolean {
    return res.error;
}

export function isCanceled(res: IActionResult): boolean {
    return res.canceled;
}

export function newError(message: string): IActionResult {
    return { error: true, canceled: false, result: message };
}

export function newCancellation(message = ''): IActionResult {
    return { error: false, canceled: true, result: message };
}

export function newSuccess(result: any = ''): IActionResult {
    return { error: false, canceled: false, result };
}
