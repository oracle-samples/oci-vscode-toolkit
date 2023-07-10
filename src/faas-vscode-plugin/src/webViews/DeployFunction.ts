/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { OCIFunctionNode } from "../../src/ui/tree/nodes/oci-function-node";
import { OCINewFunctionNode } from "../../src/ui/tree/nodes/oci-new-function-node";
import { getUri } from "../utils/getUri";

export function DeployFunctionGetWebview(webview: Webview, extensionUri: Uri, func: OCINewFunctionNode | OCIFunctionNode) {
   const css_path = ["media", "css"];
   const js_path = ["media", "js", "DeployFunction"];
   const gitCloneUri = getUri(webview, extensionUri, js_path.concat(["git-auth.js"]));
   const dropDownJs = getUri(webview, extensionUri, js_path.concat(["populateDropdown.js"]));
   const submitForm = getUri(webview, extensionUri, js_path.concat(["submitForm.js"]));
   const toggleCloneRepo = getUri(webview, extensionUri, js_path.concat(["toggleCloneRepo.js"]));
   const tableStyle = getUri(webview, extensionUri, css_path.concat(["deployFunction", "deployFunction.css"]));

   return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
       <meta charsset="UTF-8">
       <meta http-equiv="Content-Security-Policy">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <link rel="stylesheet" href="${tableStyle}">
       <script type="module" src="${gitCloneUri}"></script>
       <script type="module" src="${dropDownJs}"></script>
       <script type="module" src="${toggleCloneRepo}"></script>
       <script type="module" src="${submitForm}"></script>
       <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js"></script>
       <title>Deploy function</title>
       <style>
       </style>
    </head>
    <body id="webview-body">
       <h1>Deploy function</h1>
       <form id="form_deploy_function" method="post" action="*">
         <table>
            <tr>
               <td>
                  <label for="registry-location-input" id="registry-location-label">Registry location</label><br>
                  <input placeholder="Enter the registry location" type="text" id="registry-location-input"/><br>
               </td>
               <td>
                  <label for="memory-input" id="memory-label" >Memory (in MBs)</label><br>
                  <select id="memory-input"/>
                  </select>
               </td>
            </tr>
            <tr>
               <td>
                  <label for="application-name-input" id="application-name-label">Application name</label><br>
                  <input placeholder="${func.parent?.appSummary.displayName}" type="text" id="application-name-input" readonly/><br>
               </td>
               <td>
                  <label for="timeout-input" id="timeout-label">Timeout (in seconds)</label><br>
                  <input min="5" max="300" type="number" id="timeout-input" value="30"/><br>
               </td>
            </tr>
            <tr>
               <td>
                  <label for="function-name-input" id="function-name-label">Function name</label><br>
                  <input placeholder="${func.func.displayName}" type="text" id="function-name-input" readonly/><br>
               </td>
               <td>
                  <label for="auth-token-input" id="auth-token-label">Auth token</label><br>
                  <input type="password" id="auth-token-input"/><br>
               </td>
            </tr>
            <tr>
               <td>
                  <label for="output-level-checkbox" id="output-level-label">Output level</label><br>
                  <input type="checkbox" id="output-level-checkbox" value="Verbose Output" checked/>Verbose Output
               </td>
               <td></td>
            </tr>
         </table>

         <div class="float-container">
            <div class="float-child">
               <div><button type="submit" value="Deploy" id="deploy-button">Deploy</button></div>
            </div>
            <div class="float-child">
               <div class="cancel-button"><button value="Cancel" id="cancel-button">Cancel</button></div>
            </div>
         </div>

       </form>
    </body>
    
 </html>
    `;
}
