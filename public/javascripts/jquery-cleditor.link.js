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
  $.cleditor.buttons.linkPopup = {
    name: "linkPopup",
    css: {
      backgroundImage: "/images/buttons.gif",
      backgroundPosition: "-576px 50%"
    },
    title: "Insert link",
    command: "insertimage",
    popupName: "",
    popupHover: false,
    popupContent: "",
    
    buttonClick: function(e, data) {
        //setup the link modal
        $("#insert-link-button").unbind().bind("click", function() {
            //basic variables
            var href = "";
            var target = "";
            var title = "";
            
            //get the URL from the href field
            if($("#link-url").is(":visible")) {
                href = $("#modal-link #href").val();
                title = $("#modal-link #title").val();
                target = $("#modal-link #target").val();
            }
            //from the page id
            else if($("#link-page").is(":visible")) {
                href = $("#modal-link #pageId").val();
            }
            //from the group id
            else if($("#link-group").is(":visible")) {
                href = $("#modal-link #groupId").val();
            }
            //from content id
            else if($("#link-content").is(":visible")) {
                href = $("#modal-link #contentId").val();
            }
            
            if(!href) {
                alert("Please enter a link");
                return false;
            }
            
            //get the selected text
            var selectedText = getSelectionHtml(data.editor.doc);
            if(!selectedText) selectedText = title ? title : href;
            
            //data.editor.doc.execCommand("createlink", true, "http://www.google.com");
            data.editor.execCommand("inserthtml", "<a href=\"" + href + "\"" + (target ? " target=\"" + target + "\"":"") + (title ? " title=\"" + title + "\"":"") + ">" + selectedText + "</a>");
            $("#modal-link").modal('hide');
            
            //don't trigger standard event
            return false;
        });
        
        //reset the link form
        $("#modal-link #href").val("");
        $("#modal-link #title").val("");
        $("#modal-link #target").val("");
        $("#modal-link #pageId").val("");
        $("#modal-link #groupId").val("");
        $("#modal-link #contentId").val("");
        
        //TODO: setup the content search form
        
        $('#modal-link').modal();
        return false;
    }
    //TODO: process the click
  };
})(jQuery);

//generic get selected html function
function getSelectionHtml(window) {
    var html = "";
    if (typeof window.getSelection != "undefined") {
        var sel = window.getSelection();
        if (sel.rangeCount) {
            var container = document.createElement("div");
            for (var i = 0, len = sel.rangeCount; i < len; ++i) {
                container.appendChild(sel.getRangeAt(i).cloneContents());
            }
            html = container.innerHTML;
        }
    } else if (typeof document.selection != "undefined") {
        if (document.selection.type == "Text") {
            html = document.selection.createRange().htmlText;
        }
    }
    return html;
}