/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

export function EditFunctionSettingsGetWebview(webview: Webview, extensionUri: Uri, timeoutInSeconds: number) {
   const css_path = ["media", "css", "editFunctionSettings"];
   const js_path = ["media", "js", "editFunctionSettings"];
   const jsuri = getUri(webview, extensionUri, js_path.concat(["populateDropdown.js"]));
   const validateUri = getUri(webview, extensionUri, js_path.concat(["validateForm.js"]));
   const styleUri = getUri(webview, extensionUri, css_path.concat(["editFunctionSettings.css"]));
   const webViewHeading = localize("editFunctionSettingsViewHeading", "Edit Function Settings");
   const timeoutInputLabel = localize("timeoutInputLabel", "Timeout (in seconds)");
   const memoryInputLabel = localize("memoryInputLabel", "Memory (in MBs)");
   const updateButtonLabel = localize("updateButtonLabel", "Update");
   return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
       <meta charsset="UTF-8">
       <meta http-equiv="Content-Security-Policy">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <link rel="stylesheet" href="${styleUri}">
       <script type="module" src="${jsuri}"></script>
       <script type="module" src="${validateUri}"></script>
       <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js"></script>
       <title>Edit Function</title>
       <style>
       </style>
    </head>
    <body id="webview-body">
       <h1>${webViewHeading}</h1>
       <form id="form_update_function" method="post" action="*">
      <div>
         <label for="timeout-input" id="timeout-label">${timeoutInputLabel}</label><br>
         <input min="5" max="300" type="number" id="timeout-input" size="45px" value="${timeoutInSeconds}"/><br>
      </div>
      <div>
         <label for="memory-input" id="memory-label">${memoryInputLabel}</label><br>
         <select id="memory-input"/><br>
         </select>
      </div>
       <div>
          <button type="submit" value="Save" id="update-button"/>${updateButtonLabel}</button>
       </div>
       </form>
    </body>
    
 </html>
    `;
}
