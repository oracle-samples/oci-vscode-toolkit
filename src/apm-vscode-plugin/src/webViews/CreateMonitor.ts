/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";

export function CreateMonitorGetWebview(webview: Webview, extensionUri: Uri, vpList: string,
   scriptsList: string, apmDomainId: string) {
   const css_path = ["media", "css"];
   const js_path = ["media", "js", "monitor"];
   const download_path = ["media", "js", "download"];
   const svg_path = ["resources", "dark"];
   const errorSvg = getUri(webview, extensionUri, svg_path.concat(["error.svg"]));
   const downloadJs = getUri(webview, extensionUri, download_path.concat(["download.js"]));
   const vpDropDownJs = getUri(webview, extensionUri, js_path.concat(["populateVPs.js"]));
   const scriptDropDownJs = getUri(webview, extensionUri, js_path.concat(["populateScript.js"]));
   const submitForm = getUri(webview, extensionUri, js_path.concat(["createForm.js"]));
   const tableStyle = getUri(webview, extensionUri, css_path.concat(["synthetics.css"]));

   const showInputs = "display: none";

   return /*html*/ `
   <!DOCTYPE html>
   <html lang="en">
   <head>
       <meta charset="UTF-8">
       <meta http-equiv="Content-Security-Policy">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <link rel="stylesheet" href="${tableStyle}">  
       <script id="vp_drop_down_js" type="module" src="${vpDropDownJs}">${vpList}</script>
       <script id="script_drop_down_js" type="module" src="${scriptDropDownJs}">${scriptsList}</script>       
       <script type="text/javascript" src="${downloadJs}"></script>
       <script type="module" src="${submitForm}"></script>
       <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js"></script>
       <!-- Monaco Editor -->
       <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs/loader.js"></script>
 
        <title>Create Monitor</title>
        <style>
        </style>
   </head>
   <body id="webview-body">

      <br/></br>
      <label class="label-margin-info">Upload JSON file. For sample JSON template refer
       <a href="https://docs.oracle.com/en-us/iaas/application-performance-monitoring/doc/availability-monitor-vs.html#APMGN-GUID-8330E2EF-B5F1-472B-97AA-BF3FEA2C7C6E" target="_blank">
        Create Availability Monitor
       </a> under Visual Studio Code Plugin section &nbsp;&nbsp;</label>
      
      <div class="float-container" style="${showInputs}"> 
         <label class="label-margin">Choose an option to create using :&nbsp;&nbsp;</label>
         <label class="label-margin label-file-width" for="create-monitor">
            <input class="div-radio" type="radio" id="from-file-radio" name="create-monitor" value="file" checked/>&nbsp;File
         </label>

         <label class="label-margin label-file-width" for="create-monitor">
            <input class="div-radio" type="radio" id="from-ui-radio" name="create-monitor" value="ui" />&nbsp;&nbsp;Manual
         </label>
      </div>
      <div class="float-container file-padding" id="file-div"> 
         <input type="file" accept=".json" name="create-monitor" id="load-json-button">
      </div>&nbsp;&nbsp;

      <form id="form_create_monitor" onsubmit="return false;" method="post" action="*">
         <input class="input-margin" type="hidden" id="apmdomain-id-input" value="${apmDomainId}"/>
          <!-- Monaco Editor -->
          <div id="file-text-input"></div>
 
          <div id="file-text-input-error" style="display: none; color: red;">
             <img src="${errorSvg}"/> Invalid JSON.
          </div>
       <script>
          let editor;
          let monitorContent = "";
          require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.41.0/min/vs' }});
 
          require(['vs/editor/editor.main'], function() {
              editor = monaco.editor.create(document.getElementById('file-text-input'), {
                  value: "// Enter json object for monitor detail",
                  language: "json",
                  theme: "vs-light"
              });
 
            // Update monitorContent in real time
            editor.onDidChangeModelContent(() => {
               monitorContent = editor.getValue();
              try {
                  JSON.parse(editor.getValue());
                  document.getElementById('file-text-input-error').style.display = "none";
              } catch (e) {
                  document.getElementById('file-text-input-error').style.display = "block";
              }
            }); 
          // JSON Validation
          document.getElementById('create-button').addEventListener('click', function() {
              try {
                  JSON.parse(editor.getValue());
                  document.getElementById('file-text-input-error').style.display = "none";
              } catch (e) {
                  document.getElementById('file-text-input-error').style.display = "block";
              }
          });
 
          // Load JSON from file
          document.getElementById('load-json-button').addEventListener('change', function(event) {
              const file = event.target.files[0];
              if (file) {
                  const reader = new FileReader();
                  reader.onload = function(e) {
                      editor.setValue(JSON.stringify(JSON.parse(e.target.result), null, 2));
                  };
                  reader.readAsText(file);
              }
          });
          });
       </script>

       <!-- Monaco Editor --> 

         <div class="row" style="${showInputs}">
            <div class="file input text" id="file-text-div">
               <textarea class="textarea-margin textarea-size input-block oui-react-input" placeholder="Enter json object for monitor details" id="file-text-input-temp"></textarea>
               <div class="oui-display-hint-padding">
                 <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="file-text-input-error" style="${showInputs}">
                    <img src="${errorSvg}"/><div id="file-text-error">Invalid JSON.</div>
                 </div>
               </div>
            </div>   
            <!-- 1st column -->
            <div class="column" id="col1-div" style="${showInputs}">
               <label class="label-margin" for="monitor-name-input" id="monitor-name-label">Name</label>&nbsp;
               <input class="input-margin input-block oui-react-input" placeholder="Enter monitor name" type="text" id="monitor-name-input" />
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-text-muted" id="monitor-hint">
                     No spaces, only letters, numerals, hyphens or underscores.
                  </div>
               </div>
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="monitor-error" style="${showInputs}">
                     <img src="${errorSvg}"/><div id="monitor-error-text">Monitor name is required.</div>
                  </div>
               </div>           

               <label class="label-margin" for="script-id-input" id="script-id-label" >Script</label>
               <select class="input-margin oui-react-select" id="script-id-input"/></select>
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="script-error" style="${showInputs}">
                     <img src="${errorSvg}"/>Script is required.
                  </div>
               </div>

               <label class="label-margin" for="script-param-input" id="script-param-label" >Script Parameters (JSON)</label>
               <input class="input-margin input-block oui-react-input" placeholder="Enter script parameters in json format" type="text" id="script-param-input"/>
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="script-param-error" style="${showInputs}">
                     <img src="${errorSvg}"/>Invalid script parameters json.
                  </div>
               </div>

               <label class="label-margin" for="target-input" id="target-label">
                  Base URL<span class="oui-react-optional-text oui-text-small oui-text-muted">Optional</span>
               </label>&nbsp;
               <input class="input-margin input-block oui-react-input" placeholder="Enter target url" type="text" id="target-input"/>
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="target-error" style="${showInputs}">
                     <img src="${errorSvg}"/><div id="target-error-text">Base URL is required.</div>
                  </div>
               </div>

               <label class="label-margin" for="vantage-point-input" id="vantage-point-label" >Vantage Points</label>
               <select class="input-margin select-height" id="vantage-point-input" multiple /></select>
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-text-muted" id="vp-hint">
                     A maximum of 100 vantage points can be selected. Please note that for Vantage Points marked with (External) each Monitor Run is counted as 3 runs for licence purposes.
                  </div>
               </div>
               <div class="oui-display-hint-padding">
                  <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="vp-error" style="${showInputs}">
                     <img src="${errorSvg}"/>At least one vantage point is required.
                  </div>
               </div>

               <fieldset class="label-margin">
                  <legend>Retry on Failure</legend>
                  <input class="fs-input-margin" type="checkbox" id="enable-retry-checkbox" value="Enable Retry" checked/>&nbsp;
                  <label class="fs-label-margin" for="enable-retry-checkbox" id="enable-retry-label">Enable Retry</label>
               </fieldset>

               <!-- Tags -->
               <fieldset class="label-margin">
                  <legend>Tags</legend>
                  <label class="fs-label-margin" for="defined-tags-input" id="defined-tags-label">Defined Tags (JSON)</label>
                  <input class="fs-input-margin fieldset-input oui-react-input" placeholder="Enter defined tags in json format" type="text" id="defined-tags-input"/>
                  <div class="oui-display-hint-padding">
                     <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="defined-tags-error" style="${showInputs}">
                        <img src="${errorSvg}"/>Invalid defined tags json.
                     </div>
                  </div>

                  <label class="fs-label-margin" for="freeform-tags-input" id="freeform-tags-label">Freeform Tags (JSON)</label>
                  <input class="fs-input-margin fieldset-input oui-react-input" placeholder="Enter freeform tags in json format" type="text" id="freeform-tags-input"/>
                  <div class="oui-display-hint-padding">
                     <div class="oui-text-small oui-form-danger oui-margin-small-bottom" id="freeform-tags-error" style="${showInputs}">
                        <img src="${errorSvg}"/>Invalid freeform tags json.
                     </div>
                  </div>
               </fieldset>
            </div>

            <!-- 2nd column -->
            <div class="column" id="col2-div" style="${showInputs}">
               <fieldset class="label-margin">
                  <legend>Options</legend>
                  <label class="input-block" for="verify-ssl-checkbox" id="verify-ssl-label">
                     <input class="fs-input-margin" type="checkbox" id="verify-ssl-checkbox" value="Verify SSL" checked/>
                     &nbsp;Verify SSL
                  </label>

                  <label class="input-block" for="enable-screenshot-checkbox" id="enable-screenshot-label">
                     <input class="fs-input-margin" type="checkbox" id="enable-screenshot-checkbox" value="Enable Screenshot" checked/>
                     &nbsp;Enable Screenshot
                  </label>

                  <label class="input-block" for="override-dns-checkbox" id="override-dns-label">
                     <input class="fs-input-margin" type="checkbox" id="override-dns-checkbox" value="Override DNS"/>
                     &nbsp;Override DNS
                  </label>
                  <input class="fs-input-margin oui-react-input" placeholder="e.g. 87.5.11.11" type="text" style="${showInputs}" id="override-dns-input"/>
               </fieldset>
               
               <fieldset class="label-margin">
                  <legend>Frequency</legend>
                  <label for="interval-radio">
                     <input class="fs-input-margin form-radio" type="radio" id="interval-radio" name="frequency-radio" value="interval"/>&nbsp;Interval
                  </label>

                  <label for="runonce-radio">
                     <input class="fs-input-margin form-radio" type="radio" id="runonce-radio" name="frequency-radio" value="runOnce" checked />&nbsp;Run Once
                  </label>

                  <div id="interval-div" style="${showInputs}">
                     <label class="fs-label-margin" for="scheduling-input" id="scheduling-label" >Scheduling Policy</label>
                     <select class="fs-input-margin oui-react-select" id="scheduling-input"/>
                        <option value="ALL" selected>All</option>
                        <option value="ROUND_ROBIN">Round Robin</option>
                        <option value="BATCHED_ROUND_ROBIN">Batched Round Robin</option>
                     </select>

                     <label class="fs-label-margin" for="run-interval-input" id="run-interval-label">Interval Between Runs (minutes)</label>
                     <input class="fs-input-margin oui-react-input" value="10" id="run-interval-input" type="number" min="5" max="720" step="1" />

                     <div id="batch-div" style="${showInputs}">
                        <label class="fs-label-margin" for="batch-interval-input" id="batch-interval-label">Sub-interval Between Runs (minutes)</label>
                        <input class="fs-input-margin oui-react-input" value="1" id="batch-interval-input" type="number" min="1" max="720" step="1" />
                     </div>
                  <div>

                  <label class="fs-label-margin" for="timeout-min-input" id="timeout-min-label" >Timeout (minutes)</label>
                  <input class="fs-input-margin oui-react-input" value="3" type="number" min="1" max="15" step="1" id="timeout-min-input"/>
               </fieldset>

               <fieldset class="label-margin">
                  <legend>Network Measurements</legend>

                  <input class="fs-input-margin" type="checkbox" id="enable-network-checkbox" value="Enable Network Collection"/>&nbsp;
                  <label class="fs-label-margin" for="enable-network-checkbox" id="enable-network-label">Enable Network Collection</label>

                  <div id="network-collection-div" style="${showInputs}">
                     <label class="fs-label-margin" for="protocol-input" id="protocol-label" >Protocol</label>
                     <select class="fs-input-margin oui-react-select" id="protocol-input"/>
                        <option value="TCP" selected>TCP</option>
                        <option value="ICMP">ICMP</option>
                     </select>

                     <div id="probe-div" style="${showInputs}">
                        <label class="fs-label-margin" for="probe-input" id="probe-label" >Probe Mode</label>
                        <select class="fs-input-margin oui-react-select" id="probe-input"/>
                           <option value="SACK" selected>SACK</option>
                           <option value="SYN">SYN</option>
                        </select>
                     </div>

                     <label class="fs-label-margin" for="hop-input" id="hop-label">Probe Per Hop</label>
                     <input class="fs-input-margin oui-react-input" value="3" type="number" min="1" max="10" step="1" id="hop-input"/>
                  </div>
               </fieldset>
               <fieldset class="label-margin">
                  <legend>Availability Configuration</legend>

                     <input class="fs-input-margin" type="checkbox" id="enable-availability-checkbox" value="Enable Availability Configuration"/>&nbsp;
                     <label class="fs-label-margin" for="enable-availability-checkbox" id="enable-availability-label">Enable Availability Configuration</label>

                     <div id="availability-div" style="${showInputs}">
                        <label class="fs-label-margin" for="max-failures-input" id="max-failures-label">Maximum failures allowed per interval</label>
                        <input class="fs-input-margin oui-react-input" value="0" type="number" min="0" max="720" step="1" id="max-failures-input"/>

                        <label class="fs-label-margin" for="min-runs-input" id="min-runs-label">Minimum runs allowed per interval</label>
                        <input class="fs-input-margin oui-react-input" value="1" type="number" min="1" max="720" step="1" id="min-runs-input"/>
                     </div>
               </fieldset>
            </div>
         </div>

         <div class="button-margin float-container" id="form-buttons" >
            <button type="submit" value="Create" id="create-button">Create</button>
            &nbsp;&nbsp;
            <button type="submit" value="Save as JSON" id="save-json-button">Save as JSON</button>
            &nbsp;&nbsp;
            <button value="Cancel" id="cancel-button">Cancel</button>
         </div>

      </form>
   </body>
</html>
    `;
}
