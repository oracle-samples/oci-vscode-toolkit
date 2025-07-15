/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";

export function DownloadLogs(webview: Webview, extensionUri: Uri, header: string, content: any, fileName: string) {
    const js_path = ["media", "js", "download"];
    const downloadJs = getUri(webview, extensionUri, js_path.concat(["download.js"]));

    return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
       <meta charsset="UTF-8">
       <meta http-equiv="Content-Security-Policy">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <script type="text/javascript" src="${downloadJs}"></script>
       <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js"></script>
       <title>${header}</title>
    </head>
    <body id="webview-body">
      <h1>${header}</h1>
       <a id="downloadAnchorElem" style="display:none"></a>
       <input type="hidden" id="file-name" value="${fileName}"/>
       <textarea style="display:none" id="file-text-input" ></textarea>
       <input type="hidden" id="download-content" value="${content}"/>
    </body>
    </html>
    `;
}
