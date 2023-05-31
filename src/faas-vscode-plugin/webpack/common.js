/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

//@ts-check

'use strict';

const path = require('path');

/**@type {import('webpack').Configuration}*/
const config = {
    target: 'node',
    entry: './src/extension.ts',
    output: {
        path: path.resolve(__dirname, '../dist'),
        filename: 'extension.js',
        libraryTarget: 'commonjs2',
        devtoolModuleFilenameTemplate: '../[resource-path]',
    },
    devtool: 'source-map',
    externals: [
        {
            vscode: 'commonjs vscode',
            'node-fetch': 'commonjs2 node-fetch',
        }
    ],
    resolve: {
        extensions: ['.ts', '.js', '.json'],
        modules: ['node_modules'],
        mainFields: ['main', 'module'],
        byDependency: {
            'node-fetch': {
                mainFields: ['main', 'module']
            },
            'isomorphic-fetch': {
                mainFields: ['main', 'module']
            }
        }
    },
    module: {
        exprContextCritical: false,
        rules: [
            {
                // vscode-nls-dev loader:rewrite localize calls in sourcecode
                loader: 'vscode-nls-dev/lib/webpack-loader',
                options: {
                    base: path.join(__dirname, '../src')
                }
            },
            {
                test: /\.ts$/,
                exclude: [/node_modules/],
                use: [
                    {
                        loader: 'ts-loader',
                    },
                ],
            },
        ],
    },
};
module.exports = config;
