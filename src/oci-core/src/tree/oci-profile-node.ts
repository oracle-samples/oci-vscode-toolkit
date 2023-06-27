/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

// Represents a single profile inside the OCI config file
import * as vscode from 'vscode';
import { getResourcePath } from '../util/path-utils';
import { ociProfileNodeCommand } from '../util/resources';
import { BaseNode } from '../userinterface/base-node';
import { IOCIProfile } from '../profilemanager/profile';
import { IRootNode } from '../userinterface/root-node';
import { IOCIProfileNode } from '../userinterface/profile-node';
import { NodeCreatorFunc } from '../api/oci-api';
import { OciExtensionError } from '../errorhandler';
import { cloudShellConfigExists, getProfileNames } from '../profilemanager/profile-config';
import { ProfileManager } from '../profilemanager/profile-manager';
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();


export class OCIProfileNode extends BaseNode implements IOCIProfileNode {
    public profileName: string;
    public regionName: string;
    public profileLabel: string;

    private ociProfile: IOCIProfile;
    private readonly _childCreatorFunc: NodeCreatorFunc | undefined;

    constructor(
        ociProfile: IOCIProfile,
        profileName: string,
        profileLabel: string,
        regionName: string,
        sessionAuth: boolean,
        profileChildrenCreatorFunc?: NodeCreatorFunc,    
        collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed,
    ) {
        super(
            profileName,
            profileLabel,
            collapsibleState,
            getResourcePath('compartment-light.svg'),
            getResourcePath('compartment-dark.svg'),
            ociProfileNodeCommand,
            [],
            sessionAuth ? 'OCIProfileNodeSessionAuth' : `OCIProfileNode`,
            [],
            undefined,
            cloudShellConfigExists() ? regionName : "",
            'Region and tenancy',
        );
        this.ociProfile = ociProfile;
        this.profileName = profileName;
        this.profileLabel = profileLabel;
        this.regionName = regionName;
        this._childCreatorFunc = profileChildrenCreatorFunc;        
    }

    getChildren(element: any): Thenable<IRootNode[]> {
        const tenancy: string | null = this.ociProfile.getTenancy();
        try {
            // Check if extension is running in cloud editor, if not then we check & handle tenancy as null in config
            if (cloudShellConfigExists()) {
                if (tenancy === null || tenancy == '') {
                    const tenancyErrorMsg = localize("tenancyErrorMsg", "Tenancy cannot be null if running in vscode. Please enter valid tenancy in Config file & hit refresh tree.");
                    throw new OciExtensionError(tenancyErrorMsg);
                }
            }
        } catch (error) {
            // Reload ociprofile and assign it so next time when user refreshes tree it enters in this check
            let profileName: | string | undefined = vscode.workspace.getConfiguration().get('oci.defaultProfileName');
            const allProfiles = getProfileNames();
            if (profileName) {
                if (!allProfiles.includes(profileName)) {
                    profileName = allProfiles[0];
                    vscode.workspace
                        .getConfiguration()
                        .update('oci.defaultProfileName', profileName);
                }
                this.ociProfile = new ProfileManager(profileName);
            }
            throw error;
        }

        // return all children nodes.
        if (this._childCreatorFunc) {
            return this._childCreatorFunc();
        }
        return Promise.all([]);
    }
}
