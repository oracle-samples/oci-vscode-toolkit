/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { expect } from 'chai';
import { ActivityBar, CustomTreeItem, CustomTreeSection, ExtensionsViewItem, ExtensionsViewSection } from 'vscode-extension-tester';
const pjson = require('../../package.json');
export function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

describe('Example tests', () => {
    let apmExtension: ExtensionsViewItem;

    before(async function () {
        this.timeout(150000);
        // open the extensions view
        const view = await (await new ActivityBar().getViewControl('Extensions'))?.openView();
        const extensions = await view?.getContent().getSection('Installed') as ExtensionsViewSection;
        apmExtension = await extensions.findItem(`@installed ${pjson.name}`) as ExtensionsViewItem;
    });

    it('Check the extension name', async () => {
        const author = await apmExtension.getAuthor();
        expect(author).equals(pjson.publisher);
    });

    it('Check the extension version', async () => {
        const version = await apmExtension.getVersion();
        expect(version).equals(pjson.version);
    });

    it('Check expansion of root tree node', async () => {

        const ociView = await (await new ActivityBar().getViewControl('OCI Plugins'))?.openView();
        // replace delay with some method to wait for loading of plugin
        await delay(4000);
        const apmPluginSection = await ociView?.getContent().getSection('ApplicationPerformanceMonitoring') as CustomTreeSection;
        console.log(await apmPluginSection.getText());
        const items = await apmPluginSection.getVisibleItems() as CustomTreeItem[];
        const child = await items[0].getChildren();
        await delay(1000);
        expect(await child[0].getText()).equals("Compartments");
        // child.forEach(async (x) => await x.expand());

    });
});
