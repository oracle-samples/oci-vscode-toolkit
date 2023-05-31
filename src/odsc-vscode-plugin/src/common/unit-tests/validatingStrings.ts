/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 import { expect } from 'chai';
 import { it, describe } from 'mocha';
 import { titleCase }    from "../validators";
 
 describe('Validating strings', () => {
     it('Upper case strings are title cased', () => {
      let upperCaseString = "UPPERCASE";
       expect(titleCase(upperCaseString)).to.be.equals("Uppercase");
    });

    it('Lower case strings are title cased', () => {
      let lowerCaseString = "lowercase";
       expect(titleCase(lowerCaseString)).to.be.equals("Lowercase");
    });
 });
