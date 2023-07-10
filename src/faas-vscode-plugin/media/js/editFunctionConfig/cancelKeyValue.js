/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 $(document).ready(function($)
 {        
    //--->button > cancel > start	
    $(document).on('click', '.btn_cancel', function(event) 
    {
        event.preventDefault();
   
        $(document).find('.success-message').hide();
        $(document).find('.validation-message').hide();
        $(document).find('.validation-save-row').hide(); 
        var tbl_row = $(this).closest('tr');

        //hide save and cacel buttons
        tbl_row.find('.btn_save').hide();
        tbl_row.find('.btn_cancel').hide();

        tbl_row.find('.row_data')
        .attr('contenteditable', 'false')
        .css({
            'background-color' : '',
            'color' : ''
         });
    

        //show edit button
        tbl_row.find('.btn_edit').show();
        tbl_row.find('.btn_delete').show();

        tbl_row.find('.row_data').each(function(index, val) 
        {   
            $(this).html( $(this).attr('original_entry') ); 
        });  
    });
    //--->button > cancel > end
 }); 
