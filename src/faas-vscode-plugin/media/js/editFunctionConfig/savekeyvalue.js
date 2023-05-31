/**
 * Copyright (c) 2022, 2023, Oracle and/or its affiliates. All rights reserved.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
   $(document).ready(function($)
    {     
        let existingTable = document.getElementById("key_value_table");
        var intial_keyvalue_data = getCurrentKeyValueData(existingTable);
        //--->save whole row entry > start	
        $(document).on('click', '.btn_save', function(event) 
        {
            event.preventDefault();
            let table = document.getElementById("key_value_table");
            var keyvalue_data = getCurrentKeyValueData(table);
            //Remove validation messages if already exists
            $(document).find('.validation').hide();
            $(document).find('.validation-message').hide();
            $(document).find('.validation-save-row').hide();   
            $(document).find('.success-message').hide();
            var tbl_row = $(this).closest('tr');
    
            var row_id = tbl_row.attr('row_id');
            
            //hide save and cacel buttons
            tbl_row.find('.btn_save').hide();
            tbl_row.find('.btn_cancel').hide();
    
            //show edit button
            tbl_row.find('.btn_edit').show();
            tbl_row.find('.btn_delete').show();

            tbl_row.find('.row_data')
            .attr('contenteditable', 'false')
            .css({
                'background-color' : '',
                'color' : ''
             });
    
            //--->get row data > start
            var arr = {};
            let keyEditedExists = false;
            tbl_row.find('.row_data').each(function(index, val) 
            {   
                var col_name = $(this).attr('col_name');  
                var col_val  =  $(this).html();
                var originalKey = $(this).attr('original_entry');
                const tableContainsKey =(col_name == "key" &&  originalKey != col_val &&  checkIfKeyExists(col_val, intial_keyvalue_data));
                const duplicateKeys = hasDuplicateKeys(keyvalue_data, intial_keyvalue_data);
                if(tableContainsKey || duplicateKeys){
                    $('#error_save_key_exists').show();
                    document.getElementById('error_save_key_exists').innerHTML = document.getElementById('error_save_key_exists').innerHTML.replace("PLACEHOLDER_KEY_VALUE",JSON.stringify(col_val));
                    keyEditedExists = true;
                    return false;
                }
                arr[col_name] = col_val;
            });
            //--->get row data > end
    
            if(!keyEditedExists){
              $.extend(arr, {row_id:row_id});
            }
            else{
                tbl_row.find('.row_data').each(function(index, val) 
                {   
                    $(this).html( $(this).attr('original_entry') ); 
                });  
            }
        });
        //--->save whole row entry > end
});

function getCurrentKeyValueData(table) {
    let config = [];
    let key, value;
    var rowLength = table.rows.length;
    for (var i = 0; i < rowLength; i++) {
        var cells = table.rows.item(i).cells;
        if (key && value) {
            config.push({key:key, value:value});
        }
        for (var j = 0; j < 2; j++) {
            var cell = cells.item(j).innerHTML;
            var cellVal = cell.substring(cell.indexOf(">")+1, cell.lastIndexOf("<"));
            (j % 2 === 0) ? key = cellVal : value = cellVal;
        }

        if(i == rowLength-1){
            config.push({key:key, value:value});;
        }
    }
    return config;
}

function hasDuplicateKeys(keyvalue_data, intial_keyvalue_data){
    const newlyAddedKeyValuePairs = [];
    var set = new Set();
    for (const initialKeyValue of intial_keyvalue_data) {
        set.add(initialKeyValue.key);
    }

    for(const keyValue of keyvalue_data){
        if( !set.has(keyValue.key)){
            newlyAddedKeyValuePairs.push(keyValue)
        }
     }
    
    const keys = newlyAddedKeyValuePairs.map(keyValuePairs => keyValuePairs.key);
    const keysSet = new Set(keys);
    return keysSet.size < newlyAddedKeyValuePairs.length;
}

function checkIfKeyExists(col_val, keyvalue_data){
    return keyvalue_data.some(function(keyValue) {
        return keyValue.key === col_val;
      });
}
