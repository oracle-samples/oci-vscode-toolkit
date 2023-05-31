/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { createHash } from 'crypto';

// tslint:disable-next-line:max-line-length
const regex = /\n| |-----BEGIN CERTIFICATE-----|-----END CERTIFICATE-----|-----BEGIN RSA PRIVATE KEY-----|-----END RSA PRIVATE KEY-----|-----BEGIN RSA PUBLIC KEY-----|-----END RSA PUBLIC KEY-----|-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----|ssh-rsa|(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g;

export enum SUPPORTED_ALGORITHM {
  MD4 = 'md4',
  MD5 = 'md5',
  RMD160 = 'rmd160',
  SHA1 = 'sha1',
  SHA224 = 'sha224',
  SHA256 = 'sha256',
  SHA384 = 'sha384',
  SHA512 = 'sha512',
}

export enum SUPPORTED_ENCODING {
  HEX = 'hex',
  BASE64 = 'base64',
}

interface IConfig {
  algorithm: SUPPORTED_ALGORITHM,
  colons: boolean,
  encoding: SUPPORTED_ENCODING,
}

const DEFAULT_CONFIGURATION: IConfig = {
  algorithm: SUPPORTED_ALGORITHM.SHA256,
  colons: false,
  encoding: SUPPORTED_ENCODING.HEX,
};

function _colons(fingerprintHex: string) {
  return fingerprintHex.replace(/(.{2})(?=.)/g, '$1:');
}

export function fingerprint(
  cert: string,
  config: Partial<IConfig> | string = SUPPORTED_ALGORITHM.SHA256,
  useColons: boolean = false,
) {
  const { algorithm, colons, encoding } = Object.assign(
    Object.create(null),
    DEFAULT_CONFIGURATION,
    typeof config === 'string' ? { algorithm: config, colons: useColons } : config,
  ) as IConfig;

  const cleanKey = cert.replace(regex, '');
  const buffer = new Buffer(cleanKey, 'base64');
  const hash = createHash(algorithm.toLowerCase()).update(buffer).digest(encoding);
  return colons ? _colons(hash) : hash;
}

export default fingerprint;
