/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 $(document).ready(function($)
 {
        //--->button > delete > start	
        $(document).on('click', '.btn_delete', function(event) 
        {
            event.preventDefault();
            $(this).closest('tr').remove();
            $(document).find('.validation').hide();
            $(document).find('.validation-save-row').hide(); 
            $(document).find('.success-message').hide();
            let table = document.getElementById("key_value_table");

            let config = getCurrentKeyValueconfig(table);
            if(config.size === 0){
              $(document).find('.tbl_user_data').hide();
            }
        });
        //--->button > delete > end
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
