$(document).ready(function() {
    // setup ajax links
    $("a[rel=multiAjaxLink]").on("click", function() {
        if(window.selectedContent.length > 0) {
            var method = $(this).attr('data-method');
            if (!method) method = 'POST';
            $.ajax(this.href, {
                type: 'POST',
                data: {
                    _method: method,
                    ids: window.selectedContent,
                    selectedContent: window.selectedContent,
                    unselectedContent: window.unselectedContent,
                    filterBy: '<%- filterBy %>',
                    search: $('#content-table_filter input').val()
                },
                success: function(data) {
                    if(data.redirect) {
                        window.location = data.redirect;
                    }
                    else {
                        // show notification
                        $.noty({ text: '<i class="icon-ok"></i> ' + data.message, type: 'success' });

                        // redraw table
                        window.table.fnDraw(false);

                        setTimeout(function () {
                            // update tag counts
                            refreshTagCounts();
                        }, 500);
                    }
                }
            });
        }
        else alert("Please select some content!");

        // hide the menu
        $(this).parents(".btn-group").removeClass("open");

        return false;
    });

    function refreshTagCounts() {
        $.ajax('<%- pathTo.tagsCounts('content') %>', {
            success: function (data) {
                data.tags.forEach(function (tag) {
                    $('#tagCount-' + tag.id).text(tag.count);
                });
            }
        });
    }

    // handle the selectAllContent checkbox events
    $("#selectAllContent").on("click", function() {
        if(this.checked) {
            // check all checkboxes
            $("#content-table tbody input[type=checkbox]").attr("checked", true);

            // reset the selected content array with only the "all" value
            $.ajax('<%- pathTo.contentIds %>?filterBy=<%- filterBy %>&sSearch=' + $('#content-table_filter input').val(), {
                success: function (data) {
                    window.selectedContent = data.ids;        
                }
            });
        }
        else {
            // unselect all content
            window.selectedContent = [];

            // uncheck all checkboxes
            $("#content-table tbody input[type=checkbox]").attr("checked", null);
        }
    });

    // setup user arrays
    window.selectedContent = [];
    window.unselectedContent = [];

    window.table = $('#content-table').dataTable( {
        "bProcessing": true,
        "bServerSide": true,
        //"iDisplayLength": 20,
        "sAjaxSource": "<%- pathTo.filteredContent({ filterBy: filterBy }) %>.json",
        "fnDrawCallback": function() {
            // setup tooltips
            $('#content-table *[rel=tooltip]').tooltip();

            // setup ajax actions
            $('#content-table a[data-remote]').on("ajax:success", function() {
                //show notification
                $.noty({ text: '<i class="icon-ok"></i> ' + $(this).attr("data-success"), type: 'success' });

                // redraw table
                window.table.fnDraw(false);

                refreshTagCounts();
            });

            // click the checkboxes which are ticked
            $("#content-table tbody input[type=checkbox]").each(function(i, checkbox) {
                if(window.selectedContent.indexOf(checkbox.value) > -1 || (window.selectedContent.indexOf("all") > -1 && window.unselectedContent.indexOf(checkbox.value) == -1)) checkbox.checked = true;
            });

            // attach events to the checkboxes
            $("#content-table tbody input[type=checkbox]").on("click", function() {
                if(this.checked) {
                    window.selectedContent.push(this.value);
                    if(window.unselectedContent.indexOf(this.value) > -1) window.unselectedContent.splice(window.unselectedContent.indexOf(this.value), 1);
                }
                else {
                    if(window.selectedContent.indexOf(this.value) > -1) window.selectedContent.splice(window.selectedContent.indexOf(this.value), 1);
                    window.unselectedContent.push(this.value);
                }
            });
        },
        "aoColumns": [
            { "sDefaultContent": "", "fnRender": function(obj, val) {
                    var content = obj.aData;
                    var checkbox = '<input type="checkbox" value="' + content.id + '" id="checkbox-' + content.id + '" />';
                    checkbox = '<div class="checkbox check-default">' + checkbox + '<label for="checkbox-' + content.id + '"></label>';
                    return checkbox;
                }
            },
            { "sDefaultContent": "", fnRender: function(obj, val) {
                    var content = obj.aData;
                    var text = content.title || content.text;
                    text = text.substring(0, Math.min(32, text.length)) + (text.length > 32 ? '...':'');
                    text = text || '<span class="muted"><%= __('untitled post') %></span>';

                    return '<a href="//' + content.url + '" class="title">' + text + '</a>';
                }
            },
            { "sDefaultContent": "", "fnRender": function(obj, val) {
                    var html = '';

                    $(obj.aData.tags).each(function(i, tag) {
                        html += '<a href="<%- pathTo.content %>/filter/' + tag.id + '" class="pjax"><span class="label label-info">' + tag.title + '</span></a> ';
                    });

                    html += '';
                    return html;
                }
            },
            { "mDataProp": "timeSince" },
            { "sDefaultContent": "", "fnRender" : function(obj, val) {
                    var content = obj.aData;
                    var score = content.score;
                    var html = '<div class="progress"><div data-percentage="' + Math.min(10, content.score) * 10 + '%" id="" class="progress-bar progress-bar-success animate-progress-bar" style="width: ' + Math.min(10, content.score) * 10 + '%;"></div></div>';

                    return html;
                }
            },
            { "sDefaultContent": "", "fnRender" : function(obj, val) {
                    var content = obj.aData;
                    var html = '<div class="pull-right">';

                    if (content.canEdit || true) html += '<a href="<%- pathTo.content %>/' + content.id + '/edit"><%= t('content.actions.edit') %></a>';
                    html += ' &nbsp; <a href="<%- pathTo.content %>/' + content.id + '/destroy" data-remote="true" data-method="DELETE" data-confirm="<%= t('content.actions.destroyConfirm') %>" rel="tooltip" title="<%- t('content.actions.destroy') %>" data-success="<%= t('content.actions.destroyed') %>"><i class="icon-remove"></i></a>';

                    html += '</div>';

                    return html;
                }
            }
        ],
        "sDom": "<''<'pull-right'f>r>t<''<'pull-left'l><'pull-left'i><'pull-right'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {
            "sLengthMenu": ""
        },
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": [ 0, 5 ] }
        ]
    } );
});