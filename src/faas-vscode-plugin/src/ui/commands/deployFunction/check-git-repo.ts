/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 import path = require("path");
 import { getArtifactHook } from "../../../common/fileSystem/local-artifact";
 import { OCIFunctionNode } from "../../tree/nodes/oci-function-node";
 import { OCINewFunctionNode } from "../../tree/nodes/oci-new-function-node";
 
 export async function isGitRepo(currFunc: (OCINewFunctionNode | OCIFunctionNode)): Promise<boolean> {
     let is_git_repo = false;
     if (currFunc.isGitRepo) {
         return currFunc.isGitRepo;
     }
     else {        
         is_git_repo = getArtifactHook().pathExists(path.join(currFunc.uriRepo?.fsPath!, '.git'));
     }
     return is_git_repo;
 }
