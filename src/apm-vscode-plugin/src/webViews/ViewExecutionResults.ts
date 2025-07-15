/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";

export function ViewExecutionResults(webview: Webview, extensionUri: Uri, header: string, outputText: string, resultCount: number) {
  const css_path = ["media", "css"];
  const tableStyle = getUri(webview, extensionUri, css_path.concat(["synthetics.css"]));
  const js_path = ["media", "js", "executions"];
  const viewExecutionResultsJs = getUri(webview, extensionUri, js_path.concat(["viewExecutionResults.js"]));

  return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
       <meta charsset="UTF-8">
       <meta http-equiv="Content-Security-Policy">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <link rel="stylesheet" href="${tableStyle}">       
       <script type="module" id="view_execution_result_js" src="${viewExecutionResultsJs}">${resultCount}</script>
       <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js"></script>      
       <style>        
       </style>
    </head>
    <body id="webview-body">
    <form id="form_view_execution_results" onsubmit="return false;" method="post" action="*">   
      <div class="label-margin">
        ${header}
        <br/>
      </div>
      <div class="table, th, td">
        ${outputText}
      </div>    
      <script>
        function copyTextFunction(val, event) {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(val).then(() => {
            }).catch(err => {
              console.error('Failed to copy: ', err);
            });
          } else {
            // Fallback to old method
            const inp = document.createElement('input');
            document.body.appendChild(inp);
            inp.value = val;
            inp.select();
            try {
              document.execCommand('copy');
            } catch (err) {
              console.error('Unable to copy: ', err);
            }
            inp.remove();
          }
        }
      </script>
      <script>
        function sortTable(columnIndex) {
          const table = document.getElementById("monitor-exec-results");
          const tbody = table.tBodies[0];
          const rows = Array.from(tbody.rows);

          // Sort in descending order
          rows.sort((a, b) => {
            const valA = a.cells[columnIndex].innerText.trim();
            const valB = b.cells[columnIndex].innerText.trim();

            // If numeric, compare as numbers
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);

            if (!isNaN(numA) && !isNaN(numB)) {
              return numB - numA; // Descending
            }

            // Otherwise, compare as strings
            return valB.localeCompare(valA); // Descending
          });

          // Re-attach sorted rows
          rows.forEach(row => tbody.appendChild(row));
        }
        window.onload = function() {
          sortTable(4); // Change the column index as needed (0-based)
        };  
      </script>
    </form>
    </body>
    
    </html>
    `;
}
