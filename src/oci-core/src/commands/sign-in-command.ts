/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as jwtDecode from 'jwt-decode';

import { createKeypair } from '../keypair/keypair';
import { createProfile } from '../profilemanager/profile-manager';
import { ensureSessionProfileFolder } from '../profilemanager/profile-config';
import { AuthServer } from '../util/auth-server';
import { promptForRegion, promptForProfileName } from '../userinterface/ui-helpers';
import { ext } from '../extension-vars';
import { IKeypair } from '../keypair/jwk-keypair';

const defaultPrivateKeyName = 'oci_api_key.pem';
const defaultPublicKeyName = 'oci_api_key_public.pem';
const defaultTokenFilename = 'token';

export interface SignInResult {
    token: string;
    tenancy: string;
}

// writes the new profile to disk
export function writeNewProfile(
    profileName: string,
    region: string,
    signInResult: SignInResult,
    keypair: IKeypair,
) {
    // Create the folder under /sessions
    const sessionPath = ensureSessionProfileFolder(profileName);

    // Create all files (public, private key and token file)
    const { token, tenancy } = signInResult;
    const { publicKey, privateKey, fingerprint } = keypair;

    // Writes the public key
    const publicKeyPath = path.join(sessionPath, defaultPublicKeyName);
    fs.writeFileSync(publicKeyPath, publicKey);

    // Writes the private key
    const privateKeyPath = path.join(sessionPath, defaultPrivateKeyName);
    fs.writeFileSync(privateKeyPath, privateKey);

    // Writes the security token file
    const securityTokenPath = path.join(sessionPath, defaultTokenFilename);
    fs.writeFileSync(securityTokenPath, token);

    // Creates the profile by adding to the config file
    createProfile(
        profileName,
        fingerprint,
        privateKeyPath,
        tenancy,
        region,
        securityTokenPath,
    );
}

const srv = new AuthServer();

export async function signIn(
    existingProfileName?: string,
    existingRegion?: string,
    cancellationToken?: vscode.CancellationToken,
): Promise<string | undefined> {
    if (!srv.isStarted()) {
        srv.start();
    }

    let region = existingRegion;
    // Only prompt for region if it's not provided
    if (!region) {
        region = await promptForRegion();
        if (!region || region.trim() === '') {
            srv.stop();
            return undefined;
        }
    }

    // Prompt for profile (if needed)
    let profileName = existingProfileName;
    if (!profileName) {
        profileName = await promptForProfileName();
        if (profileName === undefined) {
            srv.stop();
            return undefined;
        }
    }

    const keypair = createKeypair();
    const url = srv.createSignInUrl(region, keypair.jwk);

    // Open the URL
    const openResult = await vscode.env.openExternal(vscode.Uri.parse(url));
    if (!openResult) {
        return undefined;
    }

    if (cancellationToken?.isCancellationRequested) {
        srv.stop();
        return undefined;
    }

    const onTokenReceived = async () => {
        return new Promise<SignInResult>((resolve, reject) => {
            if (cancellationToken?.isCancellationRequested) {
                srv.stop();
                return undefined;
            }
            srv.on('tokenReceived', async (token: any) => {
                const jwt: any = jwtDecode(token.security_token);
                const tenancy = jwt.tenant;

                resolve({ token: token.security_token, tenancy });
            });
        });
    };

    const result: SignInResult = await onTokenReceived();
    if (cancellationToken?.isCancellationRequested) {
        srv.stop();
        return undefined;
    }
    writeNewProfile(profileName, region, result, keypair);
    srv.stop();
    ext.onSignInCompletedEventEmitter.fire(profileName);

    return profileName;
}
