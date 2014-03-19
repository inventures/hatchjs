(function( $ ) {
    $.fn.valadd = function(value) {
        $(this).val(value);

        if(this.prop("nodeName") && this.prop("nodeName").toLowerCase() == "select" && $(this).val() != value) {
            $(this).append("<option value=\"" + value + "\">" + value + "</option>");
            $(this).val(value);
        }
    };
})( jQuery );