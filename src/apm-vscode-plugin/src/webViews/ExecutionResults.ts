/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";

export function GetResultsWebView(webview: Webview, extensionUri: Uri, header: string) {
   const css_path = ["media", "css"];
   const tableStyle = getUri(webview, extensionUri, css_path.concat(["synthetics.css"]));
   const svg_path = ["resources", "dark"];
   const errorSvg = getUri(webview, extensionUri, svg_path.concat(["error.svg"]));
   const js_path = ["media", "js", "executions"];
   const executionJs = getUri(webview, extensionUri, js_path.concat(["execution.js"]));

   const showInputs = "display: none";

   return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
       <meta charsset="UTF-8">
       <meta http-equiv="Content-Security-Policy">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <link rel="stylesheet" href="${tableStyle}"> 
       <script type="module" src="${executionJs}"></script>
       <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js"></script>
       <title>${header}</title>
       <style>
       </style>
    </head>
    <body id="webview-body">
       <!-- <h1>${header}</h1> -->
       <form id="form_get_result" method="post" action="*">

         <div class="row">
            <div class="column" id="range-div">
                <label class="fs-label-margin-wb" for="range-input" id="range-label" >Select Time</label>
                <select class="fs-input-margin-wb oui-react-select" id="range-input">
                    <option value="FifteenMin" selected>Last 15 minutes</option>
                    <option value="ThirtyMin">Last 30 minutes</option>
                    <option value="SixtyMin">Last 60 minutes</option>
                    <option value="EightHr">Last 8 hours</option>
                    <option value="TwentyFourHr">Last 24 hours</option>
                    <option value="OneWeek">Last one week</option>
                    <option value="Custom">Custom</option>
                </select>
            </div>
         </div>
         
         <div class="row">
            <div class="column" id="col1-div" style="${showInputs}">
               <label class="label-margin" for="start-input" id="start-label">Start date</label>&nbsp;
               <input class="input-margin input-block oui-react-input" placeholder="Enter start date" type="text" id="start-input" />
               <div class="oui-display-hint-padding">
                  <div class="left-margin oui-text-small oui-text-muted" id="start-date-hint">
                     Enter start date in 'MMM dd, yyyy HH:mm:ss UTC' format<br/>
                     e.g. Jan 01, 2025 09:30:00 UTC
                  </div>
               </div>
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="start-error" style="${showInputs}">
                     <img src="${errorSvg}"/><div id="start-error-text">Start date is required.</div>
                  </div>
               </div>
            </div>

            <div class="column" id="col2-div" style="${showInputs}">
               <label class="label-margin" for="end-input" id="end-label">End date</label>&nbsp;
               <input class="input-margin input-block oui-react-input" placeholder="Enter end date" type="text" id="end-input" />
               <div class="oui-display-hint-padding">
                  <div class="left-margin oui-text-small oui-text-muted" id="start-date-hint">
                     Enter end date in 'MMM dd, yyyy HH:mm:ss UTC' format<br/>
                     e.g. Jan 01, 2025 09:30:00 UTC
                  </div>
               </div>
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="end-error" style="${showInputs}">
                     <img src="${errorSvg}"/><div id="end-error-text">End date is required.</div>
                  </div>
               </div>
            </div>
         </div>

         <div class="button-margin float-container" id="form-buttons" >
            <button class="button-margin-wb" type="submit" value="Get Results" id="get-results-button">Get Results</button>
            &nbsp;&nbsp;
            <button class="button-margin-wb" value="Cancel" id="cancel-button">Cancel</button>
         </div>

       </form>
    </body>
    
    </html>
    `;
}
