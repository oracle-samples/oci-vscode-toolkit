/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

export interface ITemplate {
    id: string;
    label: string;
    folder: string;
    dockerFileFolder: string;
    replacements: string[];
}

export class TemplateMappings {
    static mappings: ITemplate[] = [
        {
            id: 'node',
            label: 'Node',
            folder: '/templates/node',
            dockerFileFolder: 'dockerfiles/node',
            replacements: ['func.yaml', 'package.json'],
        },
        {
            id: 'java',
            label: 'Java',
            folder: '/templates/java',
            dockerFileFolder: 'dockerfiles/java',
            replacements: ['func.yaml'],
        },
        {
            id: 'java8',
            label: 'Java 8',
            folder: '/templates/java8',
            dockerFileFolder: 'dockerfiles/java8',
            replacements: ['func.yaml'],
        },
        {
            id: 'go',
            label: 'Go',
            folder: '/templates/go',
            dockerFileFolder: 'dockerfiles/go',
            replacements: ['func.yaml'],
        },
        {
            id: 'java11',
            label: 'Java 11',
            folder: '/templates/java11',
            dockerFileFolder: 'dockerfiles/java11',
            replacements: ['func.yaml'],
        },
        {
            id: 'kotlin',
            label: 'Kotlin',
            folder: '/templates/kotlin',
            dockerFileFolder: 'dockerfiles/kotlin',
            replacements: ['func.yaml'],
        },
        {
            id: 'python',
            label: 'Python',
            folder: '/templates/python',
            dockerFileFolder: 'dockerfiles/python',
            replacements: ['func.yaml'],
        },
        {
            id: 'python3.6',
            label: 'Python 3.6',
            folder: '/templates/python36',
            dockerFileFolder: 'dockerfiles/python36',
            replacements: ['func.yaml'],
        },
        {
            id: 'python3.7.1',
            label: 'Python 3.7.1',
            folder: '/templates/python371',
            dockerFileFolder: 'dockerfiles/python371',
            replacements: ['func.yaml'],
        },
        {
            id: 'python3.8.5',
            label: 'Python 3.8.5',
            folder: '/templates/python385',
            dockerFileFolder: 'dockerfiles/python385',
            replacements: ['func.yaml'],
        },
        {
            id: 'ruby',
            label: 'Ruby',
            folder: '/templates/ruby',
            dockerFileFolder: 'dockerfiles/ruby',
            replacements: ['func.yaml'],
        },
    ];

    static getMappingByLanguageId(id: string): ITemplate {
        const result = TemplateMappings.mappings.find(
            (f) => f.id.toLowerCase() === id.toLowerCase(),
        );

        if (result) {
            return result;
        }
        throw new Error(`Language ${id} is not recognized.`);
    }

    // returns the id and label pair for the UI
    static getSupportedFunctionLanguages(): any[] {
        return TemplateMappings.mappings.map((m) => {
            return { id: m.id, label: m.label };
        });
    }
}
