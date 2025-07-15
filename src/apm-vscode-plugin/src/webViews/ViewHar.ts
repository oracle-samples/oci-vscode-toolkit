/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";

export function ViewHar(webview: Webview, extensionUri: Uri, header: string, fileNames: string, nameToStringContentMap: any, vantagePoint: string, executionTime: string) {
  const css_path = ["media", "css"];
  const tableStyle = getUri(webview, extensionUri, css_path.concat(["synthetics.css"]));
  const js_path = ["media", "js", "monitor"];
  const dropDownJs = getUri(webview, extensionUri, js_path.concat(["populateDropdownFiles.js"]));
  const submitForm = getUri(webview, extensionUri, js_path.concat(["downloadForm.js"]));

  return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
       <meta charsset="UTF-8">
       <meta http-equiv="Content-Security-Policy">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <link rel="stylesheet" href="${tableStyle}"> 
       <script>
         var vantagePoint = '${vantagePoint}';
         var executionTime = '${executionTime}';
       </script>
       <script id="dropdown_js" type="module" src="${dropDownJs}">${fileNames}</script>
       <script type="module" src="${submitForm}"></script>    
       <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js"></script>
              <!-- Monaco Editor -->
       <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs/loader.js"></script> 
       <title></title>
        <style>
        </style>
    </head>
    <body id="webview-body">
       <div class="header-text-font" id="header-text" >
        <p>${header}</p>  
       </div>

       <form id="form_download_file" onsubmit="return false;" method="post" action="*">   
         <label class="label-margin" for="dropdown-file-input" id="har-file-label" >Select HAR file</label>
         <select class="input-margin select-height" id="dropdown-file-input" /></select>

         <div class="float-container button-placement-right" id="form-buttons">
            <button type="submit" value="Download" id="download-button">Download</button>
            &nbsp;&nbsp;
            <button value="Cancel" id="cancel-button">Cancel</button>
         </div>
       
         <div class="images-margin" id="harContainer"></div>  
                   <!-- Monaco Editor -->
          <div id="file-text-input"></div>
        <script>
          let editor;

          window.addEventListener('dropdownReady', () => {
            const select = document.getElementById("dropdown-file-input");
            const nameToStringContentMap = JSON.parse(decodeURIComponent("${encodeURIComponent(JSON.stringify(nameToStringContentMap))}"));

            function getSelectedHarContent(fileName) {
              try {
                return JSON.stringify(nameToStringContentMap[fileName] || {}, null, 2);
              } catch (e) {
                return "// Failed to load HAR content.";
              }
            }

            require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs' } });

            require(['vs/editor/editor.main'], function () {
              const initialContent = getSelectedHarContent(select.value);
              editor = monaco.editor.create(document.getElementById('file-text-input'), {
                value: initialContent,
                language: "json",
                theme: "vs-light",
                readOnly: true,
                automaticLayout: true
              });

              function displayHar() {
                var selectedHarFile = select.value; 
                var selectedHarContent = nameToStringContentMap[selectedHarFile.toString()];
                const container = document.getElementById("harContainer");

                // Format content
                try {
                    monitorContent = JSON.stringify(JSON.parse(selectedHarContent), null, 2);
                } catch (e) {
                    monitorContent = selectedHarContent;
                }

                container.innerHTML = "<p>HAR content loaded in editor below.</p>";

                // Update editor content
                if (editor) {
                    editor.setValue(monitorContent);
                }
              }
              // Trigger content load upon change in select value
              select.addEventListener("change", displayHar);
              // Initial content load
              displayHar();
            });
          });
        </script>                
         

       </form>  
       
    </body>
    
    </html>
    `;
}
