/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
import { Webview, Uri } from "vscode";
import { getUri } from "../utils/getUri";
import * as nls from 'vscode-nls';

const localize: nls.LocalizeFunc = nls.loadMessageBundle();

/**
 * Defines and returns the HTML that should be rendered within the edit configuration panel.
 *
 * @param webview A reference to the extension webview
 * @param extensionUri The URI of the directory containing the extension
 * @param note An object representing a notepad note
 * @returns A template string literal containing the HTML that should be
 * rendered within the webview panel
 */
export function getWebviewContent(webview: Webview, extensionUri: Uri, config: { [key: string]: string }) {
  const css_path = ["media", "css", "editFunctionConfig"];
  const js_path = ["media", "js", "editFunctionConfig"];
  const styleUri = getUri(webview, extensionUri, css_path.concat(["editFunctionConfig.css"]));
  const addKeyValueUri = getUri(webview, extensionUri, js_path.concat(["addKeyValue.js"]));
  const cancelKeyValueUri = getUri(webview, extensionUri, js_path.concat(["cancelKeyValue.js"]));
  const deleteKeyValueUri = getUri(webview, extensionUri, js_path.concat(["deleteKeyValue.js"]));
  const editKeyValueUri = getUri(webview, extensionUri, js_path.concat(["editKeyValue.js"]));
  const keyValueTableUri = getUri(webview, extensionUri, js_path.concat(["keyValueTable.js"]));
  const saveKeyValueUri = getUri(webview, extensionUri, js_path.concat(["saveKeyValue.js"]));
  const updateKeyValuePairsUri = getUri(webview, extensionUri, js_path.concat(["updateKeyValuePairs.js"]));

  const configKeys = Object.keys(config);
  const configString = configKeys.map(function (key) {
    return "" + key + "=" + config[key];
  }).join("|");
  const webViewHeading = localize("editConfigurationViewTitle", "Edit configuration");
  const keyInputLabel = localize("keyInputLabel", "Key");
  const valueInputLabel = localize("valueInputLabel", "Value");
  const saveButtonLabel = localize("saveButtonLabel", "Save");
  const error_click_add = localize("error_click_add", "Please save the edited key (or) value and click on the add button.");
  const error_already_exists = localize("error_already_exists", "The configuration already contains a key with this name: {0}. Either enter a different name, or delete the existing key.", "PLACEHOLDER_KEY_VALUE");
  return /*html*/ `
  <!DOCTYPE html>
  <html lang="en">
  <head>
     <meta charset="UTF-8">
     <meta http-equiv="Content-Security-Policy"
      content="default-src 'none'; script-src ${webview.cspSource} https:; style-src ${webview.cspSource} 'unsafe-inline';"
     />
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
     <script type="module" src="${addKeyValueUri}"></script>
     <script type="module" src="${cancelKeyValueUri}"></script>
     <script type="module" src="${deleteKeyValueUri}"></script>
     <script type="module" src="${editKeyValueUri}"></script>
     <script type="module" src="${keyValueTableUri}"></script>
     <script type="module" src="${saveKeyValueUri}"></script>
     <script type="module" src="${updateKeyValuePairsUri}"></script>
     <link rel="stylesheet" href="${styleUri}">
     <title>Edit configuration</title>
  </head>
  <body id="webview-body">
     <h1>${webViewHeading}</h1>
     <div>
      <div>
        <table id="table_form" style="width: 720px">
          <tbody id="tbody_form">
            <tr id="tr_form">
              <td id="td_form"><div><label for="key-input" id="key" class="label-key">${keyInputLabel}</label></div></td>
              <td id="td_form"><div><label for="value-input" id="value" class="label-value">${valueInputLabel}</label></div></td>
              <td id="add-button"><div></div></td>
            </tr>
            <tr id="tr_form">
              <td id="td_form"><div><input type="text" id="key-input"/></div></td>
              <td id="td_form"><div><input type="text" id="value-input"/></div></td>
              <td id="add-button"><div><span><button id="add-key-value-button" class="btn-add-key-value"><svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M14 7v1H8v6H7V8H1V7h6V1h1v6h6z"/></svg></button></span></div></td>
            </tr>
          </tbody>
        </table>
        <input type="hidden" id="config-value" value="${configString}"/>
      </div>

      <div class='validation' id='error_enter_value_key'>${localize("error_enter_value_key", "Please enter a value in key field.")}</div>
      <div class='validation' id='error_key_char_error'>${localize("error_key_char_error", "A key can only consist of ASCII letter, digit, '-' (hyphen) or '_' (underscore) characters.")}</div>
      <div class='validation' id='error_enter_value'>${localize("error_enter_value", "Please enter the value for the entered key.")}</div>
      <div class='validation' id='error_already_exists'>${error_already_exists}</div>
      <div class='validation-message' id='error_click_add'>${error_click_add}</div>

     </div>    
     <div class="tbl_user_data" id="key-value-table">
     </div>    
     <div class='validation-message' id='error_save_edited_key'>${error_click_add}</div>
     <div class='validation-save-row' id='error_save_key_exists'>${error_already_exists}</div> 
     <div>
        <button id="save-button" class="btn-save-key-value-pairs">${saveButtonLabel}</button>
        <div class='success-message' id='success_key_added'>${localize("success_key_added", "Key value pairs are successfully saved.")}</div>
     </div>
  </body>
  </html>
  `;
}
