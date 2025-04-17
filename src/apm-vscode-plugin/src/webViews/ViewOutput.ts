/**
 * Copyright © 2025, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";

export function ViewOutput(webview: Webview, extensionUri: Uri, header: string, outputText: string) {
   const css_path = ["media", "css"];
   const tableStyle = getUri(webview, extensionUri, css_path.concat(["synthetics.css"]));

   return /*html*/ `
    <!DOCTYPE html>
    <html lang="en">
    <head>
       <meta charsset="UTF-8">
       <meta http-equiv="Content-Security-Policy">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <link rel="stylesheet" href="${tableStyle}"> 
       <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
       <script src="https://cdn.jsdelivr.net/npm/jquery-validation@1.19.3/dist/jquery.validate.min.js"></script>
       <title></title>
       <style>
       </style>
    </head>
    <body id="webview-body">
       <h3>${header}</h3>       
        <pre>${outputText}</pre> 
    </body>
    
    </html>
    `;
}
