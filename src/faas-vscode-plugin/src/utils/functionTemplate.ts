/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as path from 'path';

import { TemplateMappings } from './templateMappings';
import { getResourcePath } from './path-utils';
import { getArtifactHook } from '../common/fileSystem/local-artifact';
import { copySync } from 'oci-ide-plugin-base/dist/common/fileSystem/filesystem';

export class FunctionTemplate {
    private readonly languageId: string;

    constructor(languageId: string) {
        this.languageId = languageId;
    }

    public writeFiles(functionFolder: string) {
        const templateMapping = TemplateMappings.getMappingByLanguageId(
            this.languageId,
        );

        const templateFilepath = getResourcePath(templateMapping.folder);
        copySync(templateFilepath, functionFolder);
    }

    public replacePlaceholdersWithValue(
        functionFolder: string,
        keyValue: { key: string; value: string }[],
    ) {
        let contents = '';
        const templateMapping = TemplateMappings.getMappingByLanguageId(
            this.languageId,
        );

        templateMapping.replacements.forEach((filename: string) => {
            const file: string = path.join(functionFolder, filename);
            contents = getArtifactHook().readFile(file).toString();
            keyValue.forEach((kv) => {
                const modifiedContents = contents.replace(
                    new RegExp(kv.key, 'g'),
                    kv.value,
                );
                contents = modifiedContents;
            });
            getArtifactHook().createTextFile(file, contents);
        });
    }
}
