$(document).ready(function() {
    $('#fields-table tbody').sortable({
        handle: ".icon-move",
        items: "tr:not(.core)",
        placeholder: {
            element: function(currentItem) {
                return $("<tr class=\"placeholder\"><td colspan=\"5\"><div></div></td></tr>")[0];
            },
            update: function(container, p) {
                return;
            }
        },
        //fix the column widths
        create: function() {
            var ui = $('#fields-table tbody');
            $("td", ui).each(function(i, td) {
                $(td).css({ width: $(td).width() + "px" });
            });
        },
        update: function() {
            var data = [];

            $("#fields-table tbody tr:not(.core)").each(function(i, tr) {
                data.push($(tr).attr("data-id"));
            });

            $.ajax('<%- pathTo.reorderProfileFields() %>', { type: 'POST', data: { ids: data }, success: function(data) {
                //display notification
                $.noty({text: '<i class="icon-' + data.icon + '"></i> ' + data.message, type: data.status});
            }});
        }
    });

    $("a[rel=delete-field]").on("click", function() {
        var el = this;
        if(confirm("<%- t('users.help.deleteProfileField') %>")) {
            $.post(this.href, { success: function() {
                $(el).parents("tr").remove();
            }});
        }

        return false;
    });
} );