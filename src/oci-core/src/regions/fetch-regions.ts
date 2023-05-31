/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { IRegion } from './region';
import { Region } from 'oci-common';
import { OciExtensionError } from '../errorhandler';
import { getCloudShellConfigIfExists } from '../profilemanager/profile-config';
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

const Regions: IRegion[] = [];

//adding region to sdk if running on cloudshell
if(getCloudShellConfigIfExists()){
  Region.enableInstanceMetadata();
}

const regionsList = Region.values();

export const userFriendlyRegionsMap = new Map<string, string>([
  ["us-renton-1", "US Dev West (Renton)"], // R1
  ["us-scottsdale-1","US Dev West (Scottsdale)"], // R1
  ["us-seattle-1", "US Dev West (Seattle)"], // R1
  
  ["eu-amsterdam-1", "Netherlands Northwest (Amsterdam)"], // OC1
  ["me-abudhabi-1", "UAE Central (Abu Dhabi)"], // OC1
  ["ap-mumbai-1", "India West (Mumbai)"], // OC1
  ["uk-cardiff-1", "UK West (Newport)"], // OC1
  ["me-dubai-1", "UAE East (Dubai)"], // OC1
  ["eu-frankfurt-1", "Germany Central (Frankfurt)"], // OC1
  ["sa-saopaulo-1", "Brazil East (Sao Paulo)"], // OC1
  ["ap-hyderabad-1", "India South (Hyderabad)"], // OC1
  ["us-ashburn-1", "US East (Ashburn)"], // OC1
  ["ap-seoul-1", "South Korea Central (Seoul)"], // OC1
  ["me-jeddah-1", "Saudi Arabia West (Jeddah)"], // OC1
  ["ap-osaka-1", "Japan Central (Osaka)"], // OC1
  ["uk-london-1", "UK South (London)"], // OC1
  ["eu-milan-1", "Italy Northwest (Milan)"], // OC1
  ["ap-melbourne-1", "Australia Southeast (Melbourne)"], // OC1
  ["eu-marseille-1", "France South (Marseille)"], // OC1
  ["il-jerusalem-1", "Israel Central (Jerusalem)"], // OC1
  ["ap-tokyo-1", "Japan East (Tokyo)"], // OC1
  ["us-phoenix-1", "US West (Phoenix)"], // OC1
  ["sa-santiago-1", "Chile Central (Santiago)"], // OC1
  ["ap-singapore-1", "Singapore (Singapore)"], // OC1
  ["us-sanjose-1", "US West (San Jose)"], // OC1
  ["ap-sydney-1", "Australia East (Sydney)"], // OC1
  ["sa-vinhedo-1", "Brazil South East (Vinhedo)"], // OC1
  ["ap-chuncheon-1", "South Korea North (Chuncheon)"], // OC1
  ["ca-montreal-1", "Canada Southeast (Montreal)"], // OC1
  ["ca-toronto-1", "Canada Southeast (Toronto)"], // OC1
  ["eu-zurich-1", "Switzerland North (Zurich)"], // OC1
  ["eu-stockholm-1", "Sweden Central (Stockholm)"], // OC1

  ["us-langley-1", "US Gov East (Ashburn)"], // OC2
  ["us-luke-1", "US Gov West (Phoenix)"], // OC2

  ["us-gov-chicago-1", "US DoD North (Chicago)"], // OC3
  ["us-gov-ashburn-1", "US DoD East (Ashburn)"], // OC3
  ["us-gov-phoenix-1", "US DoD West (Phoenix)"], // OC3

  ["uk-gov-cardiff-1", "UK Gov West (Newport)"], // OC4
  ["uk-gov-london-1", "UK Gov South (London)"], // OC4

  ["ap-chiyoda-1", "NRI Dedicated Region"], // OC8
  ["ap-ibaraki-1", "NRI Dedicated Region (Osaka)"]// OC8
]);

regionsList.forEach((element) => {
  var region = { "name": element.regionId, "realmName": element.realm.realmId, "realm": element.realm.secondLevelDomain };
  Regions.push(region);
});

// Retuns the realm name (e.g. oraclecloud.com) based on the region name
const getRealmName = (regionName: string): string => {
    // regionName: us-phoenix-1
    const region = Regions.filter((r) => r.name === regionName);
    if (region.length === 0) {
        const regionNotDefinedErrorMsg = localize("regionNotDefinedErrorMsg", "regionName not defined");
        throw new OciExtensionError(regionNotDefinedErrorMsg);
    }
    return region[0].realm;
};

export { getRealmName, Regions };
