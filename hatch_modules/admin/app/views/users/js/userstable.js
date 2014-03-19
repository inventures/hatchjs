$(document).ready(function() {
    //setup ajax links
    $("a[rel=multiAjaxLink]").on("click", function() {
        if(window.selectedUsers.length > 0) {
            $.ajax(this.href, {
                type: 'POST',
                data: {
                    ids: window.selectedUsers,
                    filterBy: '<%- filterBy %>',
                    search: $('#members-table_filter input').val()
                },
                success: function(data) {
                    if(data.redirect) {
                        window.location = data.redirect;
                    }
                    else {
                        //show notification
                        $.noty({ text: '<i class="icon-ok"></i> ' + data.message, type: 'success' });

                        //redraw table
                        window.table.fnDraw(false);

                        setTimeout(function () {
                            // update tag counts
                            refreshTagCounts();
                        }, 500);
                    }
                }
            });
        }
        else alert("<%- t('users.help.selectSomeUsers') %>");

        //hide the menu
        $(this).parents(".btn-group").removeClass("open");

        return false;
    });

    // handle the selectAllContent checkbox events
    $("#selectAllUsers").on("click", function() {
        if(this.checked) {
            // check all checkboxes
            $("#members-table tbody input[type=checkbox]").attr("checked", true);

            // reset the selected content array with only the "all" value
            $.ajax('<%- pathTo.userIds %>?filterBy=<%- filterBy %>&sSearch=' + $('#members-table_filter input').val(), {
                success: function (data) {
                    window.selectedUsers = data.ids;
                }
            });
        }
        else {
            // unselect all content
            window.selectedUsers = [];

            // uncheck all checkboxes
            $("#members-table tbody input[type=checkbox]").attr("checked", null);
        }
    });

    function refreshTagCounts() {
        $.ajax('<%- pathTo.tagsCounts('users') %>', {
            success: function (data) {
                data.tags.forEach(function (tag) {
                    $('#tagCount-' + tag.id).text(tag.count);
                });
            }
        });
    }

    //setup user arrays
    window.selectedUsers = [];
    window.unselectedUsers = [];

    window.table = $('#members-table').dataTable( {
        "bProcessing": true,
        "bServerSide": true,
        //"iDisplayLength": 20,
        "sAjaxSource": "<%- pathTo.filteredUsers({ filterBy: filterBy }) %>.json",
        "fnDrawCallback": function() {
            //setup tooltips
            $('#members-table *[rel=tooltip]').tooltip();

            //setup ajax actions
            $('#members-table a[data-remote]').on("ajax:success", function() {
                //show notification
                $.noty({ text: '<i class="icon-ok"></i> ' + $(this).attr("data-success"), type: 'success' });

                //redraw table
                window.table.fnDraw(false);
            });

            //click the checkboxes which are ticked
            $("#members-table tbody input[type=checkbox]").each(function(i, checkbox) {
                if(window.selectedUsers.indexOf(checkbox.value) > -1 || (window.selectedUsers.indexOf("all") > -1 && window.unselectedUsers.indexOf(checkbox.value) == -1)) checkbox.checked = true;
            });

            //attach events to the checkboxes
            $("#members-table tbody input[type=checkbox]").on("click", function() {
                if(this.checked) {
                    window.selectedUsers.push(this.value);
                    if(window.unselectedUsers.indexOf(this.value) > -1) window.unselectedUsers.splice(window.unselectedUsers.indexOf(this.value), 1);
                }
                else {
                    if(window.selectedUsers.indexOf(this.value) > -1) window.selectedUsers.splice(window.selectedUsers.indexOf(this.value), 1);
                    window.unselectedUsers.push(this.value);
                }
            });
        },
        "aoColumns": [
            { "sDefaultContent": "", "fnRender": function(obj, val) {
                    var user = obj.aData;
                    var checkbox = '<input type="checkbox" value="' + user.id + '" id="checkbox-' + user.id + '" />';
                    checkbox = '<div class="checkbox check-default">' + checkbox + '<label for="checkbox-' + user.id + '"></label>';
                    return checkbox;
                }
            },
            { "mDataProp": "displayName" },
            { "sDefaultContent": "", "fnRender": function(obj, val) {
                    var html = '';

                    $(obj.aData.tags).each(function(i, tag) {
                        html += '<a href="<%- pathTo.community %>/filter/' + tag.id + '" class="pjax"><span class="label label-info">' + tag.title + '</span></a> ';
                    });

                    return html;
                }
            },
            { "sDefaultContent": "", "fnRender": function(obj, val) {
                    var html = '';
                    var user = obj.aData;

                    if (user.membership.state === 'blacklisted') {
                        html += '<i class="icon-flag"></i> ';
                    } else if (user.membership.state === 'pending') {
                        html += '<i class="icon-time"></i> ';
                    }

                    html += user.membership.role;
                    return html;
                }
            },
            { "mDataProp": "membership.timeSince" },
            { "sDefaultContent": "", "fnRender" : function(obj, val) {
                    var user = obj.aData;
                    var html = '';

                    //owner = no actions possible
                    if(user.membership.role == 'owner') {
                        return '-';
                    }
                    //requested = show approve
                    else if(user.membership.state === 'pending' && user.membership.requested) {
                        html += '<a href="<%- pathTo.community %>/' + user.id + '/accept" data-remote="true" rel="tooltip" title="<%- t('users.labels.approveMembership') %>" data-success="<%- t('users.help.membershipApproved') %>"><i class="icon-ok"></i></a>';
                    }
                    //pending = show resent invite
                    else if (user.membership.state === 'pending') {
                        html += '<a href="<%- pathTo.community %>/' + user.id + '/resendinvite" data-remote="true" rel="tooltip" title="<%= t('users.labels.resendInvite') %>" data-success="<%= t('users.help.inviteResent') %>"><i class="icon-envelope-alt"></i></a>';
                    }
                    //member = show upgrade to editor
                    else if (user.membership.role === 'member') {
                        html += '<a href="<%- pathTo.community %>/' + user.id + '/upgrade" data-remote="true" rel="tooltip" title="<%= t('users.labels.upgradeToEditor') %>" data-success="<%= t('users.help.memberUpgraded') %>"><i class="icon-thumbs-up"></i></a>';
                    }
                    //editor = show downgrade to member
                    else if (user.membership.role === 'editor') {
                        html += '<a href="<%- pathTo.community %>/' + user.id + '/downgrade" data-remote="true" rel="tooltip" title="<%= t('users.labels.downgradeToMember') %>" data-success="<%= t('users.help.editorDowngraded') %>"><i class="icon-thumbs-down"></i></a>';
                    }

                    html += ' &nbsp; <a href="<%- pathTo.community %>/' + user.id + '/remove" data-remote="true" data-confirm="<%= t('users.help.removeMember') %>" rel="tooltip" title="<%= t('users.labels.removeMember') %>" data-success="<%= t('users.help.memberRemoved') %>"><i class="icon-remove"></i></a>';

                    <% if (req.user.type === 'administrator') { %>
                        html += ' &nbsp; <a href="<%- pathTo.community %>/' + user.id + '/destroy" data-remote="true" data-confirm="<%= t('users.help.destroyUser') %>" rel="tooltip" title="<%= t('users.labels.destroyUser') %>" data-success="<%= t('users.help.destroyedUser') %>"><i class="icon-trash"></i></a>';
                    <% } %>

                    return html;
                }
            }
        ],
        "sDom": "<''<'pull-right'f>r>t<''<'pull-left'l><'pull-left'i><'pull-right'p>>",
        "sPaginationType": "bootstrap",
        "oLanguage": {
            "sLengthMenu": "",
            "oPaginate": {
                "sNext": "",
                "sPrevious": ""
            }
        },
        "aoColumnDefs": [
            { "bSortable": false, "aTargets": [ 0, 3,4,5 ] }
        ]
    });
});