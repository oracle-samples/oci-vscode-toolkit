/**
 * Copyright © 2022, 2023, Oracle and/or its affiliates.
 * This software is licensed to you under the Universal Permissive License (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl.
 */
 $(document).ready(function($)
 {
       //--->button > edit > start	
        $(document).on('click', '.btn_edit', function(event) 
        {
            event.preventDefault();
            $(document).find('.success-message').hide();
            $(document).find('.validation-save-row').hide();
            var tbl_row = $(this).closest('tr');
        
            tbl_row.find('.btn_save').show();
            tbl_row.find('.btn_cancel').show();
    
            //hide edit button and delete button
            tbl_row.find('.btn_edit').hide(); 
            tbl_row.find('.btn_delete').hide();
    
            //make the whole row editable
            tbl_row.find('.row_data')
            .attr('contenteditable', 'true')
            .attr('edit_type', 'button')
            .addClass('bg-warning')
            .css({
                'background-color' : '#ffffff',
                'padding' : '3px',
                'color' : '#000000'
             });
    
            //--->add the original entry > start
            tbl_row.find('.row_data').each(function(index, val) 
            {  
                //this will help in case user decided to click on cancel button
                $(this).attr('original_entry', $(this).html());
            }); 		
            //--->add the original entry > end
        });
        //--->button > edit > end
}); 
