exports.buildForm = function buildForm(form, data) {
    var c = this;
    c.__ = function(str) { return str; };

    var fieldBuilders = {
        select: function (name, params) {
            var select = '<select name="' + name + '">';
            params.options.forEach(function (opt) {
                opt = opt.toString();
                var text = opt.indexOf(':') > -1 ? opt.split(':').pop() : opt;
                var val = opt.indexOf(':') > -1 ? opt.split(':').shift() : opt;

                select += '<option value="' + val +
                    '"' + (data[name] == val ? ' selected' : '') + '>' +
                    c.__(text) + '</option>';
            });
            return select + '</select>';
        },
        input: function (name) {
            var val = data.hasOwnProperty(name) ? data[name] : '';
            return '<input type="text" name="' + name + '" value="' + val + '" />';
        },
        textarea: function (name) {
            var val = data.hasOwnProperty(name) ? data[name] : '';
            return '<textarea name="' + name + '">' + val + '</textarea>';
        },
        html: function(name) {
            var val = data.hasOwnProperty(name) ? data[name] : '';
            return '<textarea class="html" name="' + name + '">' + val + '</textarea>';
        },
        checkbox: function (name, params) {
            var val = data.hasOwnProperty(name) ? data[name] : false;
            var html = '<input type="hidden" value="" name="' + name + '"/>' +
                '<label class="checkbox"><input type="checkbox" value="1" name="' + name + '" ' + (val ? 'checked' : '') + '/>' + c.__(params.description || '') + '</label>';

            return html;
        },
        /*
        checkboxes: function (name, params) {
            return 'TODO checkboxes';
        },
        radiogroup: function (name, params) {
            return 'TODO radiogroup';
        },
        */
        tags: function(name) {
            var val = data.hasOwnProperty(name) ? data[name] : [];
            var html = '<select id="tags" name="tags[]" multiple="multiple" class="chzn-select-create col-md-12" data-placeholder="' + c.__('Enter tags...') + '">';

            (c.req.group.tags || []).forEach(function(tag) {
                html += '<option' + (val.indexOf(tag.name) > -1 ? ' selected="selected"':'') + '>' + tag.name + '</option>';
            });

            html += '</select>';
            return html;
        }
    };

    var html = '';
    if (form && form.tabs) {
        html += formTabs(form.tabs);
    } else if (form && form.fields) {
        html += formFields(form.fields);
    }

    return html;

    function formTabs(tabs) {
        var header = '<ul class="nav nav-tabs" id="media-tabs">',
            content = '<div class="tab-content">';

        for (var tab in tabs) {
            header += '<li' + (tabs[tab].active ? ' class="active"' : '') +
                '><a href="#' + tab + '-settings" data-toggle="tab">' +
                c.__(tabs[tab].title) + '</a></li>';

            content += '<div class="tab-pane' +
                (tabs[tab].active ? ' active': '') +
                '" id="' + tab + '-settings">' +
                buildForm(tabs[tab], data) +
                '</div>';
        }

        header += '</ul>';
        content += '</div>';

        return header + '\n\n' +  content;
    }

    function formFields(fields) {
        var html = '';
        for (var f in fields) {
            html += '<div class="control-group">' +
                '<label class="control-label" for="widget-' + f +
                '">' + c.__(fields[f].title || f) + '</label>\n' +
                '<div class="controls">' +
                fieldBuilders[fields[f].type](f, fields[f]) +
                (fields[f].type != 'checkbox' && fields[f].description ? '<small class="help-block">' + c.__(fields[f].description) + '</small>' : ''
                ) +
                '</div></div>';
        }
        return html;
    }
};

exports.widgetCoreAction = function (s) {
    return [this.req.pagePath, 'do/admin/widget', this.locals.widget.id || 'NOWID', s].join('/');
};
