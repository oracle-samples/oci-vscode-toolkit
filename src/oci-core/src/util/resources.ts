/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

const commandCorePrefix = 'oci-core';

export const createFullCommandName = (cmd: string): string =>
    `${commandCorePrefix}.${cmd}`;

export const resourceNodeCommand = `${commandCorePrefix}.resourceNodeClicked`;
export const ociCompartmentNodeCommand = `${commandCorePrefix}.OCICompartmentNodeItem`;
export const ociProfileNodeCommand = 'oci-account.ociProfileNode';
export const treeNodeCommands: string[] = [ociCompartmentNodeCommand, ociProfileNodeCommand];
