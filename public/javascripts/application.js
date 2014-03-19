
var csrfToken, csrfParam, pageId, groupId;

$(function () {

    csrfToken = $('meta[name=csrf-token]').attr('content');
    csrfParam = $('meta[name=csrf-param]').attr('content');
    pageId = $('meta[name=pageId]:last').attr('content');
    groupId = $('meta[name=groupId]').attr('content');

    $(document).on('click', '.new-widgets-list a', function (e) {
        e.stopPropagation();
        var type = $(this).attr('href').substr(1);
        createWidget(type);
        return false;
    });

    $(document).on('contents-updated', '.inline-edit', updateWidgetContent);

    $(document).on('click', '.widget-controls > .delete', function (e) {
        e.stopPropagation();

        if (!confirm('Are you sure you wish to delete this widget?')) {
            return false;
        }

        var $widget = $(this).closest('.widget');
        removeWidget($widget);
        return false;
    });

    $(document).on('order-changed', updateWidgetsOrder);

    $(document).on('page-reorder', '.page-item', savePageOrder);

    $(document).on('ajax:success', '.widget-settings-form', function (e, data) {
        $.noty({ text: '<i class="icon-ok"></i> Widget settings saved', type: 'success' });
        $('#modal-settings').modal('hide');
        e.stopPropagation();
    });

    $(document).on('ajax:success', '[data-widget-action]', function () {
        var $el = $(this);
        var handle = $(this).attr('data-widget-action');
        var data = $(this).attr('data-widget-action-params');
        widgetAction(handle, data);
    });

    $(document).on('ajax:success', '[data-update-content]', function (e, data) {
        var selector = $.map($(this).attr('data-update-content').split(':'), function (id) {
            return '[data-id=' + id + ']';
        }).join(' ');
        var html = '';
        if (typeof data === 'string') {
            html = data;
        } else {
            html = data.res;
        }
        $(selector).replaceWith(html);
    });

    $(document).on('ajax:success', '.adjust', function (e, data) {
        //reload the widget
        widgetAction('render:' + $(this).parents(".widget").attr("data-id"));
    });

    var $w = $(window), $d = $(document);
    $w.scroll(function(){
        if ($w.scrollTop() +100 >= $d.height() - $w.height()){
            $('.infinite-scroll-trigger').click().html('Loading more...');
        }
    });
});

function widgetAction(handle, data) {
    var h = handle.split(':');
    var action = h.shift();
    var id = h.shift();

    var path = [location.pathname + '/do/core-widgets/widget', id, action].join('/').replace('//', '/');

    if (data) {
        path += '?' + data;
    }
    $.post(path, {}, function (data) {
        if (h.length) {
            $('.editable .widget[data-id=' + id + '] [data-id=' + h[0] + ']').replaceWith(data);
        } else {
            $('.editable .widget[data-id=' + id + ']').replaceWith(data);
        }
    });
}

function send(action, data, response, done) {
    if (typeof response === 'function') {
        done = response;
        response = null;
    }
    data[csrfParam] = csrfToken;

    pageId = $('meta[name=pageId]:last').attr('content');

    var pathname = window.location.pathname.split('/do/')[0];
    if (pathname === '/') pathname = '';

    var path = pathname + '/do/admin/' + action;
    if (action.indexOf('core-widgets') > -1)  {
        path = pathname + '/do/' + action;
    }

    $.post(path, data, function (data) {
        if (typeof done === 'function') {
            done(data);
        }
    }, response);
}

function sendToWidget(action, data, response, done) {
    if (typeof response === 'function') {
        done = response;
        response = null;
    }
    data[csrfParam] = csrfToken;

    pageId = $('meta[name=pageId]:last').attr('content');

    var pathname = window.location.pathname.split('/do/')[0];
    if (pathname === '/') pathname = '';

    var path = pathname + '/do/core-widgets/widget';
    if (action) {
        path += '/' + action;
    }

    $.post(path, data, function(data) {
        if (typeof done === 'function') {
            done(data);
        }
    }, response);
}

function createWidget(type, col, row) {
    var name = type.split('/').pop();
    sendToWidget(null, {addWidget: type}, 'json', function (data) {
        if (data.error) {
            $.noty({text: "<i class='icon-warning-sign'></i> " + data.error.message, type: "error"});
        } else {
            var $widget = $(data.html);
            $.noty({text: "<i class='icon-ok'></i> Widget added", type: "success"});
            var $home;
            if (typeof col != 'undefined') {
                $home = $('.widget-list:eq(' + col + ')');
            } else if (name === 'mainmenu' || name === 'group-header') {
                $home = $('.widget-list:eq(0)');
            } else {
                var first = true;
                $('.widget-list').each(function () {
                    if (first) {
                        first = false;
                        return;
                    }
                    if (!$home && $(this).find('.not-editable-widget').size() === 0) {
                        $home = $(this);
                    }
                });
            }
            if ($home && $home.size()) {
                if(typeof row != 'undefined' && row > 0) {
                    if(row >= $home.children().length) $home.append($widget);
                    else $($widget).insertBefore($($home.children()[row]));
                } else {
                    $home.prepend($widget);
                }

                $widget.hide().slideDown();

                updateWidgetsOrder(true);
            }
        }
    });
    return false;
}

function selectGrid(type, el) {
    $(el).parent().find('li.selected-grid').removeClass('selected-grid');
    $('#templates-layouts input').attr("checked", null);
    send('page/grid', {grid: type}, 'json', function (data) {
        $('.widget-list:first').closest('#row-content').html(data.html);

        //re-intialise the dragdrop
        dragdrop.init();

        //display notification
        $.noty({text: "<i class='icon-ok'></i> Page layout changed", type: "success"});
        $(el).addClass('selected-grid');
    });
    return false;
}

function selectPageTemplate(templateId) {
    $('li.selected-grid').removeClass('selected-grid');
    send('page/grid', {templateId: templateId}, 'json', function (data) {
        $('.widget-list:first').closest('#row-content').html(data.html);

        //re-intialise the dragdrop
        dragdrop.init();

        //display notification
        $.noty({text: "<i class='icon-ok'></i> Page template changed", type: "success"});
    });
    return false;
}

function savePageOrder(e, revert) {
    var $page = $(this);
    var id = $page.attr('data-id');
    var order = $page.closest('table').find('tr.page-item').map(function () {
        return $(this).attr('data-id');
    });
    send('pages/' + id + '/reorder.json', {
        _method: 'PUT',
        url: $(this).attr('data-path'),
        order: [].slice.call(order)
    }, function (data) {
        if (data.error) {
            $.noty({text: "<i class='icon-warning-sign'></i> " + data.error, type: "error"});
            revert();
        } else {
            $page.parent().html(data.html || data);
            $.noty({text: "<i class='icon-ok'></i> Page order saved", type: "success"});
        }
    });
}

function updateWidgetsOrder(hideNotification) {
    var res = [];
    $('.column').each(function () {
        var size = $(this).attr('class').match(/col\-md\-(\d\d?)/)[1];
        var widgetList = $(this).hasClass("widget-list") ? this : $(".widget-list:first-child", this);

        var mods = [];
        $(widgetList).find('> .widget').each(function () {
            mods.push(parseInt($(this).attr('data-id'), 10));
        });
        res.push({
            size: size,
            widgets: mods
        });
    });

    send('page/columns', {widgets: JSON.stringify(res)}, function (data) {
        if(hideNotification != true) $.noty({text: "<i class='icon-ok'></i> Page layout saved", type: "success"});
    });
}

function updateWidgetContent() {
    var $el = $(this);
    var $widget = $el.closest('.widget');
    var widgetId = $widget.attr('data-id');
    sendToWidget(widgetId, {
        _method: 'PUT',
        perform: 'update',
        'with': {
            content: $el.data('html') || $el.html()
        }
    }, function (data) {
        $.noty({text: "<i class='icon-ok'></i> Widget contents updated", type: "success"});
    });
}

function removeWidget($widget) {
    var widgetId = $widget.attr('data-id');
    sendToWidget(widgetId, {
        _method: 'DELETE'
    }, function () {
        $.noty({text: "<i class='icon-ok'></i> Widget removed", type: "success"});

        $widget.remove();
        updateWidgetsOrder(true);
    });
    return false;
}
