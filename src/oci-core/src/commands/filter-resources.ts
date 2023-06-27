/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { workspace } from 'vscode';
import { promptForResourceSelection } from '../userinterface/ui-helpers';
import assert from '../util/assert';

export async function filterResources(): Promise<boolean> {
    const cfg = workspace.getConfiguration();
    let currentSelection: string[] | undefined = cfg.get<string[]>(
        'oci.resourceFilter',
    );
    assert(currentSelection);

    const selected = await promptForResourceSelection(currentSelection);
    if (!selected) {
        return Promise.resolve(false);
    }

    const newSelection: string[] = selected.map((s) => s.id);
    const sortedCurrentSelection = currentSelection.sort();
    const hasChanged = !(
        sortedCurrentSelection.length === newSelection.length &&
        sortedCurrentSelection.every(function (value, index) {
            return value === newSelection.sort()[index];
        })
    );

    // Update the configuration with new selection only if it has changed
    if (hasChanged) {
        await cfg.update('oci.resourceFilter', newSelection);
    }

    return Promise.resolve(hasChanged);
}
