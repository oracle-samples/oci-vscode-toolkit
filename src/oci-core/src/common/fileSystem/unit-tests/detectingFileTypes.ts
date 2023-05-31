/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { expect } from 'chai';
import { it, describe } from 'mocha';
import { isZipFile }    from  '../file-types';

describe('Detecting file types', () => {
    it('Compressed files detected', () => {
      expect(isZipFile("file.zip")).to.be.equals(true);
      expect(isZipFile("folder/file.gz")).to.be.equals(true);
      expect(isZipFile("file.ZIP")).to.be.equals(true);
      expect(isZipFile("file.GZ")).to.be.equals(true);
   });

   it('Uncompressed files detected', () => {
      expect(isZipFile("file.py")).to.be.equals(false);
      expect(isZipFile("folder/file.JAVA")).to.be.equals(false);
   });
});
