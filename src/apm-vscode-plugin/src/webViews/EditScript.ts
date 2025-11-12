/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";

export function EditScriptGetWebview(webview: Webview, extensionUri: Uri, scriptName: string, scriptId: string, scriptContentType: string, scriptContentEncoded: any) {
   const css_path = ["media", "css"];
   const js_path = ["media", "js", "script"];
   const decodeScriptContent = getUri(webview, extensionUri, js_path.concat(["decodeScriptContent.js"]));
   const submitForm = getUri(webview, extensionUri, js_path.concat(["editForm.js"]));
   const tableStyle = getUri(webview, extensionUri, css_path.concat(["synthetics.css"]));
   const svg_path = ["resources", "dark"];
   const errorSvg = getUri(webview, extensionUri, svg_path.concat(["error.svg"]));
   const showInputs = "display: none";

   return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
       <meta charset="UTF-8">
       <meta http-equiv="Content-Security-Policy">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <link rel="stylesheet" href="${tableStyle}"> 
       <script type="module" src="${submitForm}"></script>
       <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js"></script>
       <!-- Monaco Editor -->
       <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs/loader.js">
       </script>
       <title>Edit Script</title>
        <style>
        </style>
    </head>
    <body id="webview-body">
       <div class="label-file-width label-margin">
         <h5>Script OCID: ${scriptId}</h5>
       </div>

       <form id="form_edit_script" method="post" action="*">
         <div class="row">
            <div class="column" id="col1-div">
               <label class="label-margin" for="script-name-input" id="script-name-label">Script Name</label>&nbsp;
               <input class="input-margin input-block oui-react-input" placeholder="Enter script name" type="text" id="script-name-input" value="${scriptName}" />
               <input type="hidden" id="script-id-input" value="${scriptId}"/>
               <div class="oui-display-hint-padding">
                  <div class="label-margin oui-text-small oui-text-muted" id="script-hint">
                     No spaces, only letters, numerals, hyphens or underscores.
                  </div>
               </div>
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="script-error" style="${showInputs}">
                     <img src="${errorSvg}"/><div id="script-error-text">Script name is required.</div>
                  </div>
               </div>

               <label class="label-margin" for="script-file-input" id="script-file-label" >Script File</label>
               <input class="input-margin input-block oui-react-input" placeholder="Select script file" type="file" id="script-file-input"/>
               <input id="fileContents" type="hidden" />
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="script-file-error" style="${showInputs}">
                     <img src="${errorSvg}"/><div id="script-error-file-temp">Invalid script file.</div>
                  </div>
               </div>               
             <input type="hidden" id="script-content-type" value="${scriptContentType}"/>
             <script>    
               const fileInput = document.getElementById('script-file-input');            
               function updateAccept() {          
                  if ("${scriptContentType}" === "SIDE") {                      
                     fileInput.accept = '.side';
                  } else if ("${scriptContentType}" === "PLAYWRIGHT_TS") {
                     fileInput.accept = '.ts,.spec.ts';
                  } else if ("${scriptContentType}" === "JS") {
                     fileInput.accept = '.js';
                  }
               }
               // Set initial value on page load
               window.addEventListener('DOMContentLoaded', updateAccept);
            </script>

            <!-- Monaco Editor -->
            <div id="file-text-input"></div>
            <div class="oui-display-hint-padding">
               <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="file-text-input-error" style="${showInputs}">
                  <img src="${errorSvg}"/><div id="file-text-error">Invalid Side file</div>
               </div>
            </div>
            <script>
               let editor;
               let scriptContent; 
               var monacoDisplayLanguage;
               if ("${scriptContentType}" === "SIDE") {                      
                  scriptContent = JSON.parse(atob("${scriptContentEncoded}"), null, '\t');
                  monacoDisplayLanguage = "json";
               } else if ("${scriptContentType}" === "PLAYWRIGHT_TS") {
                  scriptContent = decodeURIComponent("${scriptContentEncoded}");
                  monacoDisplayLanguage = "typescript";
               } else if ("${scriptContentType}" === "JS") {
                  scriptContent = decodeURIComponent("${scriptContentEncoded}");
                  monacoDisplayLanguage = "javascript";
               }
               require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs' }});
   
               require(['vs/editor/editor.main'], function() {
                  editor = monaco.editor.create(document.getElementById('file-text-input'), {
                        value: scriptContent,
                        language: monacoDisplayLanguage,
                        theme: "vs-light"
                  });
   
               // Update scriptContent in real time
               editor.onDidChangeModelContent(() => {
                  scriptContent = editor.getValue();
                  try {
                        if ("${scriptContentType}" === "SIDE") {                      
                           JSON.parse(scriptContent);
                        }                  
                        document.getElementById('file-text-input-error').style.display = "none";
                  } catch (e) {
                        document.getElementById('file-text-input-error').style.display = "block";
                  }
               });
               // Load JSON from file
               document.getElementById('script-file-input').addEventListener('change', function(event) {
                  const file = event.target.files[0];
                  if (file) {
                     const reader = new FileReader();
                     reader.onload = function(e) {
                        if (selected === "SIDE") {
                           editor.setValue(JSON.stringify(JSON.parse(e.target.result), null, 2));
                        } else {
                           editor.setValue(e.target.result);
                        }
                     };
                     reader.readAsText(file);
                  }
               });
            });
       </script>

       <!-- Monaco Editor -->
            </div>
         </div>

         <div class="button-margin float-container" id="form-buttons" >
            <button type="submit" value="Update" id="edit-button">Update</button>
            &nbsp;&nbsp;
            <button value="Cancel" id="cancel-button">Cancel</button>
         </div>

       </form>
    </body>
    
 </html>
    `;
}
