var editor = ace.edit("filter");
var JavaScriptMode = require("ace/mode/javascript").Mode;
editor.getSession().setMode(new JavaScriptMode());
editor.renderer.setShowGutter(false);
editor.renderer.setPrintMarginColumn(-1);

editor.getSession().on('change', function(){
    document.getElementById("filterValue").value = editor.getSession().getValue();
});

$("#filterEnabled").bind("click", function() {
    if(this.checked) $("#filter-holder").addClass("enabled");
    else $("#filter-holder").removeClass("enabled");
});

function refreshFilterResults() {
    var url = '<%- pathTo.groupTag %>';
    $('#filter-results-count').load(url, {
        type: 'POST',
        filter: $('#filterValue').val()
    });

    return false;
}

$('#refresh-filter').bind('click', refreshFilterResults);

$('#filterExisting').bind('click', function() {
    if(this.checked) {
        $('#filter-count').show();
        refreshFilterResults();
    }
    else $('#filter-count').hide();
});