/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

//@ts-check
const { merge } = require("webpack-merge");
const common = require("./common");
const TerserPlugin = require('terser-webpack-plugin');
module.exports = merge(common, {
  mode: 'production',
  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          /*
           * Do not mangle functionnames during webpack minimization.
           * This leads to some issues as identifiers are misaligned.
           */ 
          keep_fnames: true
        },
      }),
    ],
  }
});
