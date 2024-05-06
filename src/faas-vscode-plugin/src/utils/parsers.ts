/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 import * as yaml from 'js-yaml';

 import { getArtifactHook } from '../common/fileSystem/local-artifact';
 
 // Returns the parsed YAML object
 const parseYaml = (yamlPath: string): any => {    
     const fileContents = getArtifactHook().readFile(yamlPath);
     return yaml.safeLoad(fileContents);
 };
 
 export default parseYaml;
