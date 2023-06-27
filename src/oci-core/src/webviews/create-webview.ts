/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */

import * as vscode from "vscode";
import { IWebView } from "./webview-interface";
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();


export function getWebView(extensionUri: vscode.Uri, viewType: string, title: string){
  return new CreateWebView(extensionUri, viewType, title);
}

export class CreateWebView implements IWebView{
    
    private _htmlBody!: string;
    private _panel: vscode.WebviewPanel;
    private _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    constructor(extensionUri: vscode.Uri, viewType: string, title: string) {
      
      const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

      // create a new panel.
      const panel = vscode.window.createWebviewPanel(viewType, title,
      column || vscode.ViewColumn.One,
        {
          // Enable javascript in the webview
          enableScripts: true,

          // And restrict the webview to only loading content from our extension's `media` directory.
          localResourceRoots: [
            vscode.Uri.joinPath(extensionUri, "media"),
          ],
        }
      );
      this._panel = panel;
      this._extensionUri = extensionUri;

      // Listen for when the panel is disposed
      // This happens when the user closes the panel or when the panel is closed programatically
      this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    /**
     * Updates or load HTML & associated components for view like JS & CSS into the web view 
     */
     loadView(htmlBody: string, javaScriptsToLoad: string[]=[], cssToLoad: string[]=[]) {
       if(htmlBody && htmlBody.length > 0){
        this._htmlBody = htmlBody;
        // Set the webview's initial html content
        this._update(javaScriptsToLoad, cssToLoad);
       }
       else{
        const createWebViewWarningMsg = localize("createWebViewWarningMsg","Please provide valid HTML content to load");
        vscode.window.showWarningMessage(createWebViewWarningMsg, { modal: true });
       }
    }

    /**
     * Destroy panel and clean up resources of webview
     */
    killView(): void {
      this._panel?.dispose();
    }

    getWebViewPanel(): vscode.Webview {
      return this._panel.webview;
    }
    
    private dispose() {    
        // Clean up our resources
        this._panel.dispose();
    
        while (this._disposables.length) {
          const x = this._disposables.pop();
          if (x) {
            x.dispose();
          }
        }
      }

    private async _update(javaScriptsToLoad: string[], cssToLoad: string[]) {
        const webview = this._panel.webview;
        this._panel.webview.html = this._getHtmlForWebview(webview, javaScriptsToLoad, cssToLoad);
    }
    
    private _getHtmlForWebview(webview: vscode.Webview, javaScriptsToLoad: string[], cssToLoad: string[]) {
      let javaScriptUris: Array<vscode.Uri> = [];
      let cssUris: Array<vscode.Uri> = [];
      let htmlView: Array<string> = [
        `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
        -->
        <meta http-equiv="Content-Security-Policy" content="img-src https: data:; style-src 'unsafe-inline' ${webview.cspSource};">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">`
      ];

      if(javaScriptsToLoad){
        for(var index in javaScriptsToLoad)
        {   javaScriptUris.push(webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, "media/js", javaScriptsToLoad[index])
          )); 
        }
      }

      if(cssToLoad){
        for(var index in cssToLoad)
        {  cssUris.push(webview.asWebviewUri(
           vscode.Uri.joinPath(this._extensionUri, "media/css", cssToLoad[index])
          )); 
        }
      }
      
      for(var index in cssUris)
       { 
        htmlView.push(`<link href="${cssUris[index]}" rel="stylesheet">`);
       }
      
      htmlView.push(`</script> </head> <body> ${this._htmlBody} </body>`);

      for(var index in javaScriptUris)
       { 
        htmlView.push(`<script src="${javaScriptUris[index]}"/>`);
       }
      htmlView.push(`</html>`);
      
     return htmlView.join("").toString();
    }
} 
