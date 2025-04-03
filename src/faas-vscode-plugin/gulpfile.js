/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
const gulp = require('gulp');
const ts = require('gulp-typescript');
const typescript = require('typescript');
const del = require('del');
const nls = require('vscode-nls-dev');
const path = require("path");
const webpack = require('webpack-stream');
const languages = require('oci-ide-plugin-base/dist/utils/supported-languages');
const parser = require('oci-ide-plugin-base//dist/common/parser/i18n-parser');

const tsProject = ts.createProject('./tsconfig.json', { typescript });

const cleanTask = function () {
    return del(['dist/**', 'package.nls.*.json', '*.vsix']);
};

const cleanDistFolder = function () {
    return del(['dist/**']);
};

const generateNlsForPackageJson = function () {
    return gulp.src('package.nls.json')
        .pipe(nls.createAdditionalLanguageFiles(languages.supportedLanguages, 'i18n'))
        .pipe(gulp.dest('.'));
};

const logWatchModeInfo = () => {
    console.log("webpack is watching for changes.Press `Ctrl+C` to exit watch mode.");
    return Promise.resolve("Info is logged"); // This return statement is required for gulp to know this task is done
};

const watchTask = function () {
    logWatchModeInfo();
    gulp.watch(('./src/**/*.ts'), gulp.series(cleanDistFolder, webpackDevTask, logWatchModeInfo));
};

const webpackDevTask = function () {
    return webpackDevAndGenerateNlsForSrc('./webpack/dev.js');
};

const webpackProdTask = function () {
    return webpackDevAndGenerateNlsForSrc('./webpack/prod.js');
};

const webpackDevAndGenerateNlsForSrc = function (filename) {
    return tsProject.src()
        .pipe(webpack({ config: require(filename) }))
        .pipe(nls.createAdditionalLanguageFiles(languages.supportedLanguages, 'i18n'))
        .pipe(nls.bundleMetaDataFiles('Oracle.faas', 'dist'))
        .pipe(nls.bundleLanguageFiles())
        .pipe(gulp.dest('dist'));
};

const extractStringsForTranslationTask = function () {
    const translatedStringsFolderPath = path.join(__dirname, 'ips-translated-strings');
    const metadataDirPath = path.join(__dirname, 'dist');
    return (parser.extractStringsToTranslate(__dirname, translatedStringsFolderPath, metadataDirPath, 'en'));
};

const addTranslatedStringsTask = function () {
    const translatedStringsFolderPath = path.join(__dirname, 'ips-translated-strings');
    const i18nFolderPath = path.join(__dirname, 'i18n');
    return (parser.makeI18nStructure(translatedStringsFolderPath, i18nFolderPath));
};

gulp.task('webpack', gulp.series(cleanTask, webpackProdTask, generateNlsForPackageJson));
gulp.task('webpack-dev-watch', gulp.series(cleanTask, webpackDevTask, generateNlsForPackageJson, watchTask));
gulp.task('extract-strings-for-translation', extractStringsForTranslationTask);
gulp.task('add-translated-strings-i18nFolder', addTranslatedStringsTask);
