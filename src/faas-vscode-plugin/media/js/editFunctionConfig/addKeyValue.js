/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 $(document).ready(function($)
 {      
     //--->button > add-key-value > start	
        $(document).on('click', '.btn-add-key-value', function(event) 
        {
            event.preventDefault();
            var keyInput = $('#key-input').val();
            var valueInput = $('#value-input').val();
            var expr = /^[a-zA-Z0-9-_]*$/;
            let table = document.getElementById("key_value_table");
            var keyvalue_data = getCurrentKeyValueData(table);

           //Remove validation and success messages if already exists
           $(document).find('.validation-message').hide();
           $(document).find('.validation').hide();
           $(document).find('.validation-save-row').hide(); 
           $(document).find('.success-message').hide();

            if(keyInput.length === 0) {
                $('#error_enter_value_key').show();
            }
            else if(!expr.test(keyInput)){
                $('#error_key_char_error').show();
            }
            else if(valueInput.length === 0){
                $('#error_enter_value').show();
            }
            else if(keyvalue_data.filter(data => data.key === keyInput).length > 0){
                $('#error_already_exists').show();
                document.getElementById('error_already_exists').innerHTML = document.getElementById('error_already_exists').innerHTML.replace("PLACEHOLDER_KEY_VALUE",JSON.stringify(keyInput));
            }
            else if($(document).find(".btn_save").is(":visible")){
                $('#error_save_edited_key').show();
                return false;
              }
            else{
            $(document).find('.tbl_user_data').show();
            
            // Adding a row inside the tbody.
            $('#tbody').append(`<tr row_id="'+keyInput+'">
                <td ><div class="row_data" col_name="key">${keyInput}</div></td>
                <td ><div class="row_data" col_name="value">${valueInput}</div></td>

                //--->edit options > start
                <td id="edit-delete-button">
                 
                   <span class="btn_edit" > <a href="#" class="btn btn-link " row_id="'+row_id+'" > <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M13.23 1h-1.46L3.52 9.25l-.16.22L1 13.59 2.41 15l4.12-2.36.22-.16L15 4.23V2.77L13.23 1zM2.41 13.59l1.51-3 1.45 1.45-2.96 1.55zm3.83-2.06L4.47 9.76l8-8 1.77 1.77-8 8z"/></svg></a></span>
                   <span class="btn_delete" > <a href="#" class="btn btn-link " row_id="'+row_id+'" > <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z"/></svg></a> </span>

                    <span class="btn_save"> <a href="#" class="btn btn-link"  row_id="'+row_id+'"> <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z"/></svg></a></span>
                    <span class="btn_cancel"> <a href="#" class="btn btn-link" row_id="'+row_id+'"> <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.116 8l-4.558 4.558.884.884L8 8.884l4.558 4.558.884-.884L8.884 8l4.558-4.558-.884-.884L8 7.116 3.442 2.558l-.884.884L7.116 8z"/></svg></span>

                </td>
                //--->edit options > end
                
           </tr>`)

           //Hide save and cancel button on adding new key value pairs
           $(document).find('.btn_save').hide();
           $(document).find('.btn_cancel').hide(); 
 
           //resetting the values to empty after adding to the table
           $('#key-input').val('');
           $('#value-input').val('');
           }
        });
        //--->button > add-key-value > end
    });

    function getCurrentKeyValueData(table){
        let config = getCurrentKeyValueconfig(table);
        let keyvalue_data = Array.from(config, ([key, value]) => ({ key, value }));
        return keyvalue_data;
    }

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
