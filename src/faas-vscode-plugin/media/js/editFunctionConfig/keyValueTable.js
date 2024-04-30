/**
 * Copyright © 2022, 2024, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
$(document).ready(function($)
    {
       let config = document.getElementById("config-value").value;
       //key value row data
       let keyvalue_data = getKeyValueDataFromConfig(config);

       var tbl = '';
       tbl +='<table id="key_value_table" style="width: 720px">'
            //--->create table body > start
            tbl +='<tbody id="tbody">';
    
                //--->create table body rows > start
                $.each(keyvalue_data, function(index, val) 
                {
                    var row_id = index;
    
                    tbl +='<tr row_id="'+row_id+'">';
                        tbl +='<td ><div class="row_data" col_name="key">'+val['key']+'</div></td>';
                        tbl +='<td ><div class="row_data" col_name="value">'+val['value']+'</div></td>';
    
                        //--->edit options > start
                        tbl +='<td id="edit-delete-button">';
                         
                            tbl +='<span class="btn_edit" > <a href="#" class="btn btn-link " row_id="'+row_id+'" > <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path d="M13.23 1h-1.46L3.52 9.25l-.16.22L1 13.59 2.41 15l4.12-2.36.22-.16L15 4.23V2.77L13.23 1zM2.41 13.59l1.51-3 1.45 1.45-2.96 1.55zm3.83-2.06L4.47 9.76l8-8 1.77 1.77-8 8z"/></svg></a></span>';
                            tbl +='<span class="btn_delete" > <a href="#" class="btn btn-link " row_id="'+row_id+'" > <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M10 3h3v1h-1v9l-1 1H4l-1-1V4H2V3h3V2a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v1zM9 2H6v1h3V2zM4 13h7V4H4v9zm2-8H5v7h1V5zm1 0h1v7H7V5zm2 0h1v7H9V5z"/></svg></a> </span>';
    
                            //only show this button if edit button is clicked
                            tbl +='<span class="btn_save"> <a href="#" class="btn btn-link"  row_id="'+row_id+'"> <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M14.431 3.323l-8.47 10-.79-.036-3.35-4.77.818-.574 2.978 4.24 8.051-9.506.764.646z"/></svg></a></span>';
                            tbl +='<span class="btn_cancel"> <a href="#" class="btn btn-link" row_id="'+row_id+'"> <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor"><path fill-rule="evenodd" clip-rule="evenodd" d="M7.116 8l-4.558 4.558.884.884L8 8.884l4.558 4.558.884-.884L8.884 8l4.558-4.558-.884-.884L8 7.116 3.442 2.558l-.884.884L7.116 8z"/></svg></span>';
    
                        tbl +='</td>';
                        //--->edit options > end
                        
                    tbl +='</tr>';
                });
    
                //--->create table body rows > end
    
            tbl +='</tbody>';
            //--->create table body > end
    
        tbl +='</table>';
        //--->create data table > end
    
        //output table data
        $(document).find('.tbl_user_data').html(tbl);
    
        $(document).find('.btn_save').hide();
        $(document).find('.btn_cancel').hide(); 

        if(keyvalue_data.length == 0){
            $(document).find('.tbl_user_data').hide();
          }
});

function getKeyValueDataFromConfig(config) {
    let configStringArray = config !== '' ? config.split('|') : [];
    let keyvalue_data = [];
    for (var index in configStringArray) {
        let keyValue = configStringArray[index].split('=');
        keyvalue_data.push({ key: keyValue[0], value: keyValue[1] });
    }
    return keyvalue_data;
}
