/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 import { getLatestRemoteCommit, getRepo, gitCloneAndCheckout } from "../../../common/git/git-clone";
 import { Repository } from "../../../git";
 import { OCIFunctionNode } from "../../tree/nodes/oci-function-node";
 import { OCINewFunctionNode } from "../../tree/nodes/oci-new-function-node";
 import * as vscode from 'vscode';
 import { getArtifactHook, getFAASRootFolder, ARTIFACT_DEPLOY_FUNC_FOLDER } from "../../../common/fileSystem/local-artifact";
 import * as pathModule from "path";
 
 
 export async function getDeployFunction(currFunc: (OCINewFunctionNode | OCIFunctionNode)): Promise<Repository> {
     if (!currFunc.repository) {
         currFunc.repository = await getRepo(currFunc.uriRepo!);
     }
     var latestRemoteCommit = await getLatestRemoteCommit(currFunc.repository!);
     let deploy_repo: Repository = currFunc.repository!;
     if (latestRemoteCommit === null) {
         deploy_repo = currFunc.repository!;
     } else {
         getArtifactHook().remove(ARTIFACT_DEPLOY_FUNC_FOLDER);
         try {
             deploy_repo = await gitCloneAndCheckout(currFunc.repository?.state.remotes[0].fetchUrl!, getFAASRootFolder() + pathModule.sep + ARTIFACT_DEPLOY_FUNC_FOLDER, latestRemoteCommit!);
         } catch (error) {
             vscode.window.showErrorMessage(`${error}`, { modal: false });
         }
     }
     return deploy_repo;
 }
