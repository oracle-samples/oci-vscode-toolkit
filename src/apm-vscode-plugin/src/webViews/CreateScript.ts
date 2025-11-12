/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";

export function CreateScriptGetWebview(webview: Webview, extensionUri: Uri,
   fileExplorerScriptContentEncoded: any, scriptFileExt: any, currentTreeSelection: any, scriptName: string,) {
   const css_path = ["media", "css"];
   const js_path = ["media", "js", "script"];
   const submitForm = getUri(webview, extensionUri, js_path.concat(["createForm.js"]));
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
       <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs/loader.js"></script>
 
        <title>Create Script</title>
        <style>
        </style>
    </head>
    <body id="webview-body">
       <form id="form_create_script" method="post" action="*">
         <label id="apm-domain-selected-msg"></label>

         <label class="label-margin column">Choose an option to create using :&nbsp;&nbsp;</label>
         <label class="label-margin label-file-width" for="create-script">
            <input class="div-radio" type="radio" id="side-radio" name="create-script" value="SIDE" checked/>&nbsp;SIDE
         </label>    
         <label class="label-margin label-file-width" for="create-script">   
            <input class="div-radio" type="radio" id="ts-radio" name="create-script" value="PLAYWRIGHT_TS" />&nbsp;&nbsp;TS
         </label>     
         <label class="label-margin label-file-width" for="create-script">   
            <input class="div-radio" type="radio" id="js-radio" name="create-script" value="JS" />&nbsp;&nbsp;JS
         </label>

         <div class="row">
            <div class="column" id="col1-div">
               <label class="label-margin" for="script-name-input" id="script-name-label">APM Availability Script Name</label>&nbsp;
               <input class="input-margin input-block oui-react-input" placeholder="Enter script name" type="text" id="script-name-input" value="${scriptName}"/>
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-text-muted" id="script-hint">
                     No spaces, only letters, numerals, hyphens or underscores.
                  </div>
               </div>
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="script-error" style="${showInputs}">
                     <img src="${errorSvg}"/><div id="script-error-text">Script name is required.</div>
                  </div>
               </div>

               <div id="treeInfo"></div>

               <label class="label-margin" for="script-file-input" id="script-file-label" >Script File</label>
               <input class="input-margin input-block oui-react-input" placeholder="Select script file" type="file" id="script-file-input"/>
               <input id="fileContents" type="hidden" />
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="script-file-error" style="${showInputs}">
                      <img src="${errorSvg}"/><div id="file-text-error-tmp">Invalid SIDE file.</div>
                  </div>
               </div>
              
               <!-- Monaco Editor -->
               <div id="file-text-input"></div>
               <div class="oui-display-hint-padding">
                 <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="file-text-input-error"  style="${showInputs}">
                     <img src="${errorSvg}"/><div id="file-text-error">Invalid Side file</div>
                  </div>
               </div>
              
               <script>
                  let editor;
                  let scriptContent = "// Enter file content";
                  var monacoDisplayLanguage = "json";

                  require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs' }});  
                  
                  if ("${scriptFileExt}" !== undefined && "${scriptFileExt}" !== "") {  
                     if ("${scriptFileExt}" === ".side") {
                        monacoDisplayLanguage = "json";
                        document.getElementById('side-radio').checked = true;
                        scriptContent = JSON.parse(atob("${fileExplorerScriptContentEncoded}"), null, '\t');
                     } else if ("${scriptFileExt}" === ".ts") {
                        monacoDisplayLanguage = "typescript"; 
                        document.getElementById('ts-radio').checked = true;
                        scriptContent = decodeURIComponent("${fileExplorerScriptContentEncoded}");
                     } else if ("${scriptFileExt}" === ".js") {
                        monacoDisplayLanguage = "javascript"; 
                        document.getElementById('js-radio').checked = true;
                        scriptContent = decodeURIComponent("${fileExplorerScriptContentEncoded}");
                     }
                  } 
         
                  require(['vs/editor/editor.main'], function() {
                     editor = monaco.editor.create(document.getElementById('file-text-input'), {
                           value: scriptContent,
                           language: monacoDisplayLanguage,
                           theme: "vs-light"
                        });

                     const selected = document.querySelector('input[name="create-script"]:checked').value;                     
                     // Update scriptContent in real time
                     editor.onDidChangeModelContent(() => {
                        scriptContent = editor.getValue();
                        try {
                              const selected = document.querySelector('input[name="create-script"]:checked').value;
                              if (selected === "SIDE") {
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
                              const selected = document.querySelector('input[name="create-script"]:checked').value;
                              if (selected === "SIDE") {
                                 editor.setValue(JSON.stringify(JSON.parse(e.target.result), null, 2));
                              } else {
                                 editor.setValue(e.target.result);
                              }
                           };
                           reader.readAsText(file);
                        }
                     });

                     const fileInput = document.getElementById('script-file-input');
                     const radios = document.querySelectorAll('input[name="create-script"]');
                     var monacoDisplayLanguage;
                     function radioChangeHandler() {
                        const selected = document.querySelector('input[name="create-script"]:checked').value;
                        if (selected === 'SIDE') {
                           fileInput.accept = '.side';
                           monacoDisplayLanguage = "json";
                        } else if (selected === 'PLAYWRIGHT_TS') {
                           fileInput.accept = '.ts,.spec.ts';
                           monacoDisplayLanguage = "typescript";
                        } else if (selected === 'JS') {
                           fileInput.accept = '.js';
                           monacoDisplayLanguage = "javascript";
                        }                        
                        monaco.editor.setModelLanguage(editor.getModel(), monacoDisplayLanguage);
                     }

                     // Attach event listener to each radio button
                     radios.forEach(radio => {
                        radio.addEventListener('change', radioChangeHandler);
                     });

                     function currentTreeSelectionChangeHandler(currentTreeSelectionNode) {                      
                        let scriptCreateType = "APMPlugin";
                        if ("${scriptFileExt}" !== undefined && "${scriptFileExt}" !== "") {
                           scriptCreateType = "FileExplorer";
                        }                       
                        document.getElementById('treeInfo').dataset.scriptCreateType = scriptCreateType; 
                        if (scriptCreateType === "FileExplorer") {
                           if (currentTreeSelectionNode !== undefined) {
                              document.getElementById('treeInfo').dataset.currentTreeSelection = JSON.stringify(currentTreeSelectionNode);  
                              document.getElementById('apm-domain-selected-msg').innerHTML = "<br/>APM Domain: " + currentTreeSelectionNode.label + "<br/><br/>";                         
                              document.getElementById("apm-domain-selected-msg").style.color = "";
                           } else {
                              document.getElementById('apm-domain-selected-msg').innerHTML = "<br/>No APM Domain selected." +
                              " You can select APM Domain from tree view of APM extension by expanding compartments, and selecting required Domain to create Availability Script.<br/>" + 
                              " Refer <a href='https://docs.oracle.com/en-us/iaas/application-performance-monitoring/doc/prerequisites-visual-studio.html'>Create an APM Domain</a> to create Domain. &nbsp;&nbsp;<br/><br/>";
                              document.getElementById("apm-domain-selected-msg").style.color = "red";
                           }
                        }
                     }

                     // Attach event listener to take action on APM Domain tree node change 
                     window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.type === 'treeSelectionChanged') {
                           const node = message.payload;
                           currentTreeSelectionChangeHandler(node.currentTreeSelection);                           
                        }
                     });     

                     // Set initial value on page load
                     window.onload = function() {
                        radioChangeHandler(); 
                        currentTreeSelectionChangeHandler(${currentTreeSelection});
                     }; 
                  });                                   
               </script>

               <!-- Monaco Editor -->
            </div>
         </div>

         <div class="button-margin float-container" id="form-buttons" >
            <button type="submit" value="Create" id="create-button">Create</button>
            &nbsp;&nbsp;
            <button value="Cancel" id="cancel-button">Cancel</button>
         </div>

       </form>
    </body>
    
 </html>
    `;
}
