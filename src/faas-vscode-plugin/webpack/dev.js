/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

//@ts-check
const { merge } = require("webpack-merge");
const common = require("./common");
module.exports = merge(common, {
    mode: "development",
});
