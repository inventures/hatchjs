/**
 @preserve CLEditor Icon Plugin v1.0
 http://premiumsoftware.net/cleditor
 requires CLEditor v1.2 or later
 
 Copyright 2010, Chris Landowski, Premium Software, LLC
 Dual licensed under the MIT or GPL Version 2 licenses.
*/

// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name jquery.cleditor.icon.min.js
// ==/ClosureCompiler==

(function($) {

  // Define the icon button
  $.cleditor.buttons.imagePopup = {
    name: "imagePopup",
    css: {
      backgroundImage: "/images/buttons.gif",
      backgroundPosition: "-552px 50%"
    },
    title: "Insert media",
    command: "insertimage",
    popupName: "",
    popupHover: false,
    popupContent: "",
    buttonClick: function(e, data) {
        //setup the image modal
        $("#modal-upload-button").unbind().bind("click", function() {
            //TODO: upload and set the src
            //$("#modal-image-preview").attr("src", "");
            
            //hide the tabs
            $("#modal-image-tabs").addClass("hidden");
            $("#modal-image-details").removeClass("hidden");
            $("#modal-image-undo").removeClass("hidden");
            
            return false;
        });
        
        //undo button
        $("#modal-image-undo").unbind().bind("click", function() {
            $("#modal-image-tabs").removeClass("hidden");
            $("#modal-image-details").addClass("hidden");
            $("#modal-image-undo").addClass("hidden");
        });
        
        $("#modal-insert-image-button").unbind().bind("click", function() {
            if($("#modal-image-details").hasClass("hidden")) {
                alert("Please select something to insert!");
                return false;
            }
            
            var src = $("#modal-image-preview").attr("src");
            var align = $("#modal-image-align").val();
            var alt = $("#modal-image-alt").val();
            var width = $("#modal-image-width").val();
            var height = $("#modal-image-height").val();
            
            //insert into the editor
            data.editor.execCommand("inserthtml", "<img src=\"" + src + "\"" + (align ? " class=\"" + align + "\"":"") + (alt ? " alt=\"" + alt + "\"":"") + (width > 0 && height > 0 ? " style=\"width: " + width + "px; height: " + height + "px; \"":"") + " />");
            
            //set the height of the editor
            data.editor.setHeight();
            
            $("#modal-image").modal('hide');
        });
        
        var selectedText = getSelectionHtml(data.editor.doc);
        var img = $(selectedText);
        
        //if we have a selected image, show the details
        if(img.length > 0) {
            $("#modal-image-tabs").addClass("hidden");
            $("#modal-image-details").removeClass("hidden");
            $("#modal-image-undo").removeClass("hidden");
            
            $("#modal-image-preview").attr("src", img.attr("src"));
            $("#modal-image-alt").val(img.attr("alt"));
            $("#modal-image-width").val(img.width());
            $("#modal-image-height").val(img.height());
            $("#modal-image-align").val(img.attr("class"));
        }
        //otherwise, show the selection box
        else {
            $("#modal-image-tabs").removeClass("hidden");
            $("#modal-image-details").addClass("hidden");
            $("#modal-image-undo").addClass("hidden");
            
            //TODO: reset the forms
        }
        
        $('#modal-image').modal();
        return false;
    }
  };
})(jQuery);