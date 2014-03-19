$(document).ready(function() {
    $('#pages-table tbody').sortable({
        handle: ".icon-move, .drag",
        items: "tr:not(.homepage)",
        //fix the column widths
        placeholder: {
            element: function(currentItem) {
                return $("<tr class=\"placeholder\"><td colspan=\"5\"><div></div></td></tr>")[0];
            },
            update: function(container, p) {
                return;
            }
        },
        start: function(event, ui) {
            $(".new-page-form").hide().appendTo($("#pages-table tbody"));
        },
        create: function() {
            var ui = $('#pages-table tbody');
            $("tr:not(.new-page-form) td:not(.placeholder)", ui).each(function(i, td) {
                $(td).css({ width: $(td).width() + "px" });
            });
        },
        stop: function(event, ui) {
            //set the indent level
            var $item = ui.item, oldClass;

            $item.removeClass (function (index, css) {
                oldClass = css.match(/\blevel\S+/g)[0];
                return oldClass || '';
            });
            var curClass = ui.placeholder.attr("class").match(/\blevel\S+/g)[0];
            if(!$item.hasClass("new-page")) $item.addClass(curClass);

            var id = $item.attr('data-id');
            var parentClass = curClass.replace(/(\d+)/, function (w, n) {
                return n - 1;
            });

            var $parent = $item.prevAll('.' + parentClass);

            if($item.attr("data-id") == "new") {
                if($parent.attr("data-id")) {
                    $(".new-page-form").removeClass (function (index, css) { return (css.match (/\blevel\S+/g) || []).join(' '); });
                    $(".new-page-form").addClass(curClass).insertAfter($item).show();
                    $(".new-page-form input").focus();

                    //set the parent id
                    $("#parentId").val($parent.attr("data-id"));

                    //set the order
                    $("#order").val($item.closest("tbody").children().index($item));

                    //put the page back at the bottom of the tree
                    $item.appendTo($("#pages-table tbody"));
                    $item.addClass("level0");
                }

                return;
            }

            var oldPath = $item.attr('data-path');
            if ($parent.size()) {
                var parentPath = $parent.attr('data-path').replace(/\/$/, '');
                var newPath = parentPath + '/' + $item.attr('data-path').split('/').pop();
                $item.attr('data-path', newPath);
                $item.trigger('page-reorder', revert);
            } else {
                revert();
            }

            function revert() {
                $item.attr('data-path', oldPath);
                $item.removeClass(curClass);
                $item.addClass(oldClass);
            }

        },
        sort: function(event, ui) {
            var prev = ui.placeholder.prev();
            if(prev.hasClass("ui-sortable-helper")) prev = prev.prev();

            var prevLevel = parseInt((((prev.attr("class") || "").match(/\blevel\S+/g) || ["level0"])[0] || "level0").replace("level", ""));
            var currentLevel = (ui.item.attr("class").match(/\blevel\S+/g) || ["level0"])[0];
            var currentIndent = currentLevel != null ? parseInt(currentLevel.replace("level", "")) * 32 : 0;

            var indent = parseInt((ui.position.left - ui.originalPosition.left + 10 + currentIndent) / 32);
            var maxIndent = Math.min(prev.length != 0 ? prevLevel +1 : 0, 8);

            //constrain
            indent = Math.min(maxIndent, Math.max(1, indent));

            //if we drag to the end below the new page dragger, force indent to 0
            if((prev.attr("class") || "").match(/\blevel\S+/g) == null) indent = 0;

            //remove all indent classes
            $(ui.placeholder).removeClass (function (index, css) { return (css.match (/\blevel\S+/g) || []).join(' '); });
            $(ui.placeholder).addClass("level" + indent);
        }
    });
} );

//bind the page creation event
$('body').on('ajax:success', '#newPageForm', function(e, data) {
    //refresh the page tree
    $("#pages-table tbody").html(data.html);

    //hide the modal
    $("#newPage").modal('hide');
    $("#newPageForm")[0].reset();
});

$('body').on('click', '#cancelButton', function() {
    $(".new-page-form").hide().appendTo($("#pages-table tbody"));
});

$('body').on('ajax:success', '#newPageFormInline', function(data) {
    $("#pages-table tbody").load('<%- pathTo.renderTree() %>');
});

//stop delete page from reloading
$('body').on('click', 'a[rel=delete-page]', function() {
    var el = this;
    if(confirm("Are you sure you wish to delete this page?")) {
        $.ajax(this.href, {
            method: 'DELETE',
            success: function() {
                //redraw the page tree
                $("#pages-table tbody").load('<%- pathTo.renderTree() %>');
            }
        });
    }

    return false;
});