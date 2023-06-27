/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import * as vscode from 'vscode';
import { GitExtension, Repository } from '../../git';
import { getRepoNamefromRepoUrl } from "./parse-git-url";

export async function gitCloneWithExt(repositoryUrl: string, parentDir?: string): Promise<Repository | undefined | null> {

    repositoryUrl = repositoryUrl.trim().replace(/^git\s+clone\s+/, '');
    await vscode.commands.executeCommand('git.clone', repositoryUrl, parentDir);

    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
    const git = gitExtension?.getAPI(1);

    var repoName = getRepoNamefromRepoUrl(repositoryUrl);
    const uri = vscode.Uri.parse(`${parentDir}/${repoName}`);
    await git?.openRepository(uri);
    return git?.getRepository(uri);
}

export async function getRepo(path: vscode.Uri): Promise<Repository | null | undefined> {
    const gitExtension = vscode.extensions.getExtension<GitExtension>('vscode.git')?.exports;
    const git = gitExtension?.getAPI(1);
    return git?.getRepository(path);
}

export async function getLatestRemoteCommit(repo: Repository) {
    await repo.fetch();
    var diff = await repo.diff();
    console.log("Diff:", diff);
    if (repo.state.HEAD?.upstream === undefined || (repo.state.HEAD.ahead === undefined || repo.state.HEAD.behind === undefined)) {
        console.log("Branch not on remote");
        return null;
    } else {
        var commitLog = await repo.log();
        if (repo.state.HEAD.ahead === 0 && repo.state.HEAD.behind === 0) {
            if (diff !== '') {
                return repo.state.HEAD.commit;
            } else {
                return null;
            }
        }
        if (repo.state.HEAD.ahead > 0) {
            return commitLog[repo.state.HEAD.ahead].hash;
        } if (repo.state.HEAD.behind < 0) {
            return null;
        }
    }
}

export async function gitCloneAndCheckout(repositoryUrl: string, parentDir: string, commitHash: string) {
    var new_repo = await gitCloneWithExt(repositoryUrl!, parentDir);
    if (new_repo !== undefined && new_repo !== null) {
        await new_repo.checkout(commitHash);
        return new_repo;
    }
    throw Error("Clone failed");
}
