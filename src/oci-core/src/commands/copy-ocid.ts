/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { env } from 'vscode';

// Stores the compartment ID in the clipboard
export async function copyOCID(compartmentId: string) {
    await env.clipboard.writeText(compartmentId);
}
