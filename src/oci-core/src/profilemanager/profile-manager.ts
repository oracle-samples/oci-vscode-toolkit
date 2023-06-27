/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as fs from 'fs';
import * as ini from 'ini';
import {
    ConfigFileReader,
    ConfigFile,
} from 'oci-common/lib/config-file-reader';
import assert from '../util/assert';
import {
    getConfigFilePath, cloudShellConfigExists
} from './profile-config';
import { IOCIProfile, IProfileConfig } from './profile';
import { getLogger } from '../logger/logging';
import { throwIfEmpty } from '../util/validators';
import { OciExtensionError } from '../errorhandler';
import * as nls from 'vscode-nls';
var package_json = require('../../package.json');

const logger = getLogger("oci-vscode-toolkit");

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

// Returns an array of all profile names from the config file.
export function getAllProfileNames(): string[] {
    const filePath = getConfigFilePath();
    if (!fs.existsSync(filePath)) {
        const missingConfigFileMsg = localize("missingConfigFileMsg", "configuration file is missing");
        logger.error(missingConfigFileMsg, filePath);
        return [];
    }

    try {
        const data = ini.parse(fs.readFileSync(filePath, 'utf-8'));
        return Array.from(Object.keys(data));
    } catch (err) {
        const invalidConfigFileMsg = localize("invalidConfigFileMsg", "configuration file is invalid");
        logger.error(invalidConfigFileMsg, filePath);
        throw err;
    }
}

export function createProfile(
    name: string,
    fingerprint: string,
    keyfile: string,
    tenancy: string,
    region: string,
    securityTokenFilePath: string,
) {
    throwIfEmpty(name, 'name');
    throwIfEmpty(fingerprint, 'fingerprint');
    throwIfEmpty(keyfile, 'keyfile');
    throwIfEmpty(tenancy, 'tenancy');
    throwIfEmpty(region, 'region');
    throwIfEmpty(securityTokenFilePath, 'securityTokenFilePath');

    const data = {
        fingerprint,
        key_file: keyfile,
        tenancy,
        region,
        security_token_file: securityTokenFilePath,
    };

    if (!fs.existsSync(keyfile)) {
        const missingKeyFileMsg = localize("missingKeyFileMsg", "key_file does not exist");
        throw new OciExtensionError(missingKeyFileMsg);
    }

    if (!fs.existsSync(securityTokenFilePath)) {
        const missingTokenFileMsg = localize("missingTokenFileMsg", "security_token_file does not exist");
        throw new OciExtensionError(missingTokenFileMsg);
    }

    const configFile = getConfigFilePath();
    if (fs.existsSync(configFile)) {
        // Need to update the existing profile (if it's already in the file)
        const configContents = fs.readFileSync(configFile).toString('utf8');
        const config = ini.parse(configContents);
        config[name] = data;
        fs.writeFileSync(configFile, ini.encode(config));
    } else {
        // OCI config does not exist - we create a new file
        fs.writeFileSync(getConfigFilePath(), ini.stringify(data, name));
    }
}

export class ProfileManager implements IOCIProfile {
    private readonly profile: IProfileConfig;
    private readonly profileName: string;

    constructor(profileName: string) {
        this.profileName = profileName;
        this.profile = this.readProfile();
    }

    private readProfile(): IProfileConfig {
        const configFile: ConfigFile = ConfigFileReader.parseFileFromPath(
            getConfigFilePath(),
            this.profileName,
        );
        const attributes:
            | Map<string, string>
            | undefined = configFile.accumulator.configurationsByProfile.get(
                this.profileName,
            );

        // Set user agent for IDE extension
        let userAgent: string;
        cloudShellConfigExists() ? userAgent = 'Oracle-Vscode-Toolkit' : userAgent = 'Oracle-Toolkit-VSCode-Marketplace';
        process.env.OCI_SDK_APPEND_USER_AGENT = `${userAgent}/${package_json.version}`;

        assert(attributes, 'attributes');
        return this.verifyAttributes(this.profileName, attributes);
    }

    private verifyAttributes(
        profileName: string,
        attributes: Map<string, string>,
    ): IProfileConfig {
        const fingerprint = attributes.get('fingerprint');
        var region = attributes.get('region') || "";
        const tenancy = attributes.get('tenancy') || "";
        const keyFile = attributes.get("key_file") || "";
        var user = attributes.get('user') || "";

        if (process.env.OCI_REGION) {
            region = process.env.OCI_REGION;
        }
        if (process.env.OCI_CS_USER_OCID) {
            user = process.env.OCI_CS_USER_OCID;
        }

        return {
            fingerprint,
            profileName,
            region,
            tenancy,
            keyFile,
            user: user,
            securityTokenFilePath: attributes.get('security_token_file'),
        };
    }

    // returns a value indicating whether the profile uses session auth or not
    public usesSessionAuth(): boolean {
        // Try and get the token file - if it exists -> we are using session auth.
        return Boolean(this.profile.securityTokenFilePath);
    }

    public getRegionName(): string {
        return this.profile.region;
    }

    public setRegionName(regionName: string): void {
        this.profile.region = regionName;
    }

    public getPrivateKey(): string {
        const privateKeyFile = this.profile.keyFile;
        const contents = fs.readFileSync(privateKeyFile).toString('utf8');
        assert(contents, 'contents');
        return contents;
    }

    // Gets contents of the security_token_file (if it exists)
    public getSecurityToken(): string | undefined {
        const tokenFile = this.profile.securityTokenFilePath;

        if (tokenFile) {
            const contents = fs.readFileSync(tokenFile).toString('utf8');
            assert(contents, 'contents');
            return contents;
        }
        return undefined;
    }

    // Updates the value in the security token file
    public updateSecurityToken(updatedTokenValue: string): void {
        const tokenFile = this.profile.securityTokenFilePath;
        if (tokenFile) {
            fs.writeFileSync(tokenFile, updatedTokenValue);
        }
    }

    public getTenancy(): string {
        return this.profile.tenancy;
    }

    public getProfileName(): string {
        return this.profileName;
    }

    public getUser(): string {
        return this.profile.user;
    }
}
