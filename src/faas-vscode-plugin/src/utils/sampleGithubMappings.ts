/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import path = require("path");
import { getArtifactHook } from "../common/fileSystem/local-artifact";
import { getResourcePath } from "./path-utils";
import * as fs from 'fs';
import { copySync } from "oci-ide-plugin-base/dist/common/fileSystem/filesystem";

export interface ISample {
    id: string;
    label: string;
    folder: string;
}

// Class to manage and display the Sample store in resources/samples
export class SampleMappings {

    readonly mapping: ISample[] = [];

    constructor() {
        this.populateSamples();
    }

    private populateSamples(): ISample[] {
        let children = fs.readdirSync(getResourcePath('samples'));
        children.forEach(element => {
            this.mapping.push({ id: element.split('/').pop()!, folder: path.join(getResourcePath('samples'), element), label: '' });
        });
        return this.mapping;
    }

    static copySampleToLocal(fromFolder: string, toFolder: string) {
        getArtifactHook().ensureDirectoryExists(toFolder);
        copySync(fromFolder, toFolder);
    }

    getMappingBySampleName(name: string): ISample {
        const result = this.mapping.find(
            (f) => f.id.toLowerCase() === name.toLowerCase(),
        );

        if (result) {
            return result;
        }
        throw new Error(`Sample ${name} not found.`);
    }

    getSampleNames(): any[] {
        return this.mapping.map((m) => {
            return m.id;
        });
    }
}
