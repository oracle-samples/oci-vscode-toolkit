/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";

export function ViewScreenshots(webview: Webview, extensionUri: Uri, header: string, fileNames: string, nameToResultsetMap: any, vantagePoint: string, executionTime: string) {
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
       <title></title>
       <style>
       </style>
    </head>
    <body id="webview-body">
       <div class="header-text-font" id="header-text" >
        <p>${header}</p>  
       </div>

       <form id="form_download_file" onsubmit="return false;" method="post" action="*">
         <label class="label-margin" for="dropdown-file-input" id="screenshot-file-label" >Select Screenshot file</label>
         <select class="input-margin select-height" id="dropdown-file-input" /></select>

         <div class="float-container button-placement-right" id="form-buttons">
            <button type="submit" value="Download" id="download-button">Download</button>
            &nbsp;&nbsp;
            <button value="Cancel" id="cancel-button">Cancel</button>
         </div>
              
         <div class="images-margin" id="imageContainer"></div>               
         <script>         
            window.addEventListener('dropdownReady', () => {
               const select = document.getElementById("dropdown-file-input");   
               const nameToResultsetMap = JSON.parse(decodeURIComponent("${encodeURIComponent(JSON.stringify(nameToResultsetMap))}"));                        

               // This function will be called to populate the image container with images
               function displayImages() {                                
                  var container = document.getElementById("imageContainer"); 
                  var newImages = '';                    
                  var selectedFile = select.value;             

                  if (selectedFile === 'All') {                  
                     Object.entries(nameToResultsetMap).forEach(([key, value]) => {                
                        if (key.startsWith('img')) {
                           newImages += '<br/><br/>Custom Image, Timestamp: ' + value.timestamp + '<br/><br/><img src="data:image/png;base64,'+ value.byteContent + '" />' ;
                        } else {
                           newImages += '<br/><br/>Timestamp: ' + value.timestamp + '<br/><br/><img src="data:image/png;base64,'+ value.byteContent + '" />' ;   
                        }                  
                     });  
                  } else {
                     let selectedByteContent = nameToResultsetMap[selectedFile.toString()].byteContent;
                     let timestamp = nameToResultsetMap[selectedFile.toString()].timestamp;   
                     if (selectedFile.toString().startsWith('img')) {
                           newImages += '<br/><br/>Custom Image, Timestamp: ' + timestamp + '<br/><br/><img src="data:image/png;base64,'+ selectedByteContent + '" />' ;
                     } else {
                        newImages += '<br/><br/>Timestamp: ' + timestamp + '<br/><br/><img src="data:image/png;base64,'+ selectedByteContent + '" />' ;   
                     }  
                  }                
                  container.innerHTML = newImages;   
               }  
               // Trigger content load upon change in select value  
               select.addEventListener("change", displayImages);
               // Initial content load
               displayImages();               
            });  
         </script>   

       </form>  
       
    </body>
    
    </html>
    `;
}
