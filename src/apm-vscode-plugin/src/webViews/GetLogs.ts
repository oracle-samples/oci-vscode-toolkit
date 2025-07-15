/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";
import { ExecutionResults } from "../ui-helpers/ui-helpers";


export function GetLogsWebView(webview: Webview, extensionUri: Uri, header: string, vpList: string,
   fileName: string, execType: ExecutionResults) {
   const css_path = ["media", "css"];
   const tableStyle = getUri(webview, extensionUri, css_path.concat(["synthetics.css"]));
   const svg_path = ["resources", "dark"];
   const errorSvg = getUri(webview, extensionUri, svg_path.concat(["error.svg"]));
   const js_path = ["media", "js", "monitor"];
   const populateVPs = getUri(webview, extensionUri, js_path.concat(["populateVPs.js"]));
   const logsJs = getUri(webview, extensionUri, js_path.concat(["viewResults.js"]));

   const showInputs = "display: none";

   return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
       <meta charsset="UTF-8">
       <meta http-equiv="Content-Security-Policy">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <link rel="stylesheet" href="${tableStyle}">
       <script>var execType = '${execType}'</script>
       <script id="vp_drop_down_js" type="module" src="${populateVPs}">${vpList}</script>
       <script type="module" src="${logsJs}"></script>
       <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js"></script>
       <title>${header}</title>
    </head>
    <body id="webview-body">
       <h1>${header}</h1>
       <form id="form_get_logs" method="post" action="*">

         <div class="row">
            <div class="column" id="time-div" >
               <label class="label-margin" for="time-input" id="start-label">Timestamp</label>&nbsp;
               <input class="input-margin input-block oui-react-input" placeholder="Enter timestamp in epoch format" type="text" id="time-input" />
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="time-error" style="${showInputs}">
                     <img src="${errorSvg}"/><div id="time-error-text">Timestamp is required.</div>
                  </div>
               </div>
            </div>
         </div>
         
         <div class="row">
            <div class="column" id="vp-div">
               <label class="fs-label-margin-wb" for="vp-input" id="vp-label" >Select Vantage Point</label>
               <select class="fs-input-margin-wb oui-react-select" id="vantage-point-input"></select>
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="vp-error" style="${showInputs}">
                     <img src="${errorSvg}"/><div id="vp-error-text">Vantage point is required.</div>
                  </div>
               </div>
            </div>
         </div>

         <a id="downloadAnchorElem" style="display:none"></a>
         <input type="hidden" id="file-name" value="${fileName}"/>
         <textarea style="display:none" id="file-text-input" ></textarea>
         <input type="hidden" id="download-content" value=""/>

         <div class="button-margin float-container" id="form-buttons" >
            <button class="button-margin-wb" type="submit" value="${header}" id="get-logs-button">${header}</button>
            &nbsp;&nbsp;
            <button class="button-margin-wb" value="Cancel" id="cancel-button">Cancel</button>
         </div>

       </form>
    </body>
    
    </html>
    `;
}
