/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { SandboxFolder } from "../../common/fileSystem/sandbox-folder";
import * as os from 'os';
import {workspace} from 'vscode';
import * as pathModule from "path";

export function  getDefaultArtifactFolderPath(subFolderPath: string){
  return `${os.homedir()}`+ pathModule.sep + workspace.getConfiguration().get('oci.defaultArtifactFolder')+ pathModule.sep + subFolderPath;
}

export function getArtifactsSandboxFolder(subFolderPath: string) : SandboxFolder {
      return new SandboxFolder(getDefaultArtifactFolderPath(subFolderPath));
}
