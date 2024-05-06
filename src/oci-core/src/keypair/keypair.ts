/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import { fingerprint as fp } from '../util/key-fingerprint';
import { IKeypair } from './jwk-keypair';
import { generateKeyPairSync, createPublicKey } from "crypto";

// Creates a new Keypair with public and private key, JWK and fingerprint
export const createKeypair = (): IKeypair => {
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicExponent: 65537,
    publicKeyEncoding: {
      type: "pkcs1",
      format: "pem"
    },
    privateKeyEncoding: {
      type: "pkcs1",
      format: "pem"
    }
  });

  const publicKeyJWKObject = createPublicKey(publicKey);
  const jwk = publicKeyJWKObject.export({ format: 'jwk' });
  
  const jwkUpdated = {
    // This is added in the OCI CLI as well, following the same process
    kid: 'Ignored',
    ...jwk,
  };

  const fingerprint = fp(publicKey, 'sha256', true);
  return {
    publicKey: publicKey,
    privateKey: privateKey,
    jwk: jwkUpdated,
    fingerprint,
  };
};
