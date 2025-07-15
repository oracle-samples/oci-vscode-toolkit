/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";

export function ViewLogs(webview: Webview, extensionUri: Uri, header: string, selectedFileName: string, errorContent: string, logContent: string) {
   const css_path = ["media", "css"];
   const tableStyle = getUri(webview, extensionUri, css_path.concat(["synthetics.css"]));
   const js_path = ["media", "js", "monitor"];
   const submitForm = getUri(webview, extensionUri, js_path.concat(["downloadForm.js"]));

   return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
       <meta charsset="UTF-8">
       <meta http-equiv="Content-Security-Policy">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <link rel="stylesheet" href="${tableStyle}"> 
       <script type="module" src="${submitForm}"></script>    
       <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js"></script>
       <title></title>
       <style>
       </style>
    </head>
    <body id="webview-body">
      <h3>${header}</h3>  <br/>       

       <form id="form_download_file" onsubmit="return false;" method="post" action="*">

         <div id="errorLogsDiv" hidden="hidden">            
            <h4>Error Logs</h4>  
            <pre>${errorContent}</pre>             
         </div>   
         <div id="outputLogsDiv" hidden="hidden">               
            <h4>Output Logs</h4>  
            <pre>${logContent}</pre><br/><br/>
         </div>   

         <script>   
            function displayLogs() {
               if ('${selectedFileName}' === 'error.log') {
                  document.getElementById("errorLogsDiv").style.display = 'block'; 
               } else {
                  document.getElementById("outputLogsDiv").style.display = 'block'; 
               }
            }
            displayLogs();
         </script>  

         <div class="button-margin float-container" id="form-buttons" >
            <button type="submit" value="Download" id="download-button">Download</button>
            &nbsp;&nbsp;
            <button value="Cancel" id="cancel-button">Cancel</button>
         </div>
       </form>  
       
    </body>
    
    </html>
    `;
}
