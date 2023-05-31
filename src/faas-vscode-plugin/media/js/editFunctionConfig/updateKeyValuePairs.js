/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 $(document).ready(function($)
 { 
    const vscode = acquireVsCodeApi();
    //--->save the key value pairs with the config
    $(document).on('click', '.btn-save-key-value-pairs', function(event) 
    { 
      $(document).find('.success-message').hide();
      $(document).find('.validation-message').hide();
      $(document).find('.validation-save-row').hide(); 
      $(document).find('.validation').hide();
      if($(document).find(".btn_save").is(":visible")){
        $('#error_save_edited_key').show();
        return false;
      }
       let table = document.getElementById("key_value_table");
       let config = getCurrentKeyValueconfig(table);             
          vscode.postMessage({
          command: 'updateKeyValuePairs',
          value: Object.fromEntries(config)
         });
         $('#success_key_added').show();
    });
}); 

function getCurrentKeyValueconfig(table) {
   let config = new Map();
   let key, value;
   var rowLength = table.rows.length;
   for (var i = 0; i < rowLength; i++) {
       var cells = table.rows.item(i).cells;
       if (key && value) {
           config.set(key, value);
       }
       for (var j = 0; j < 2; j++) {
           var cell = cells.item(j).innerHTML;
           var cellVal = cell.substring(cell.indexOf(">")+1, cell.lastIndexOf("<"));
           (j % 2 === 0) ? key = cellVal : value = cellVal;
       }

       if(i == rowLength-1){
           config.set(key, value);
       }
   }
   return config;
}
