var path = require('path');

exports.__ = function (s) {
    return s;
};

exports.renderPartial = function (view) {
    var result = '';

    if (view.indexOf('.') < 3) {
        view = path.join(this.controllerName, view).replace(/\\/g, '/');
        view = this.compound.structure.views[view];
    }

    this.res.render(view, this.viewContext, done);
    
    function done (err, html) {
        if(err) {
            result = err;
        } else {
            result = html;
        }
    }

    var res = result.toString();
    res.toHtmlString = function() {
        return result;
    };

    return res;
};

exports.specialPagePath = function () {
    return '';
};

exports.formInput = function(params, value) {
    var c = this;
    var view = this.viewContext;
    var html = '';
    var val;

    if(!value) value = '';

    // start input holder
    html += '<div class="form-group">';

    // label

    var labelText = params.title;
    if (params.helpText) {
        labelText += view.icon('info-sign', {rel: 'popover', title: 'Help', 'data-content': params.helpText});
    }
    html += view.labelTag(labelText, {class: 'control-label', for: params.name});

    if (params.description && params.description.trim() != '<p><br></p>') {
        html += '<span class="help">';
        html += params.description;
        html += '</span>';
    }

    html += '<div class="controls">';

    // input
    switch (params.type) {
        case 'text':
        case 'password':
            html += view.inputTag({
                type: params.type,
                value: value,
                id: params.name,
                name: params.name,
                class: 'form-control'
            });
            break;
        case 'textarea':
            html += view.textareaTag(value, {id: params.name, name: params.name, rows: 10, class: 'col-md-4'});
            break;
        case 'select':
        case 'select-list':
            html += '<select id="' + params.name + '" name="' + params.name + '" class="form-control">';
            html += '<option value="">Please select</option>';

            params.options.forEach(function(opt) {
                var text = opt.toString();
                val = text;
                if(typeof opt === 'object') {
                    val = Object.keys(opt)[0];
                    text = opt[val];
                }

                html += '<option' + (val == value ? ' selected="selected"':'') + ' value="' + val + '">' + text + '</option>';
            });

            html += '</select>';
            break;
        case 'radio':
        case 'radio-list':
            params.options.forEach(function(option) {
                var optionParams = {
                    name: params.name,
                    type: 'radio',
                    value: option
                };
                if (option == value) {
                    optionParams.checked = 'checked';
                }
                var labelText = view.inputTag(optionParams) + option;

                html += c.labelTag(labelText, {class: 'radio'}) + labelText;
            });
            break;
        case 'checkbox':
            html = '<div class="form-group">';
            html += '<div class="checkbox">';
            html += '<input type="checkbox" name="' + params.name + '" id="' + params.name + '" ' + (value?'checked':'') + '>';
            html += '<label for="' + params.name + '">' + params.title + '</label>';
            html += '</div>';
            html += '</div>';

            break;
        case 'check-list':
            params.options.forEach(function(option) {
                var optionParams = {
                    name: params.name,
                    type: 'checkbox',
                    value: option
                };
                if (value.indexOf(option) > -1) {
                    optionParams.checked = 'checked';
                }
                var labelText = view.inputTag(optionParams) + option;
                html += view.labelTag(labelText, {class: 'checkbox'});
            });
            break;
        default:
            throw new Error('unknown form input type: ' + params.type);
    }

    //mandatory indicator asterisk
    if (params.mandatory) {
        html += ' <i class="icon-asterisk text-error" rel="tooltip" title="' + view.__('mandatory field') + '"></i>';
    }

    if (params.privacy == 'private') {
        html += ' <i class="icon-lock" rel="tooltip" title="' + view.__('private field - will not be displayed on your profile') + '"></i>';
    }

    // end
    html += '</div></div>';

    return html;
};

exports.formatNumber = function formatNumber(num) {
    if(num === null || num === undefined) {
        return 0;
    } else if(num >= 1000000000) {
        return Math.round(num / 100000000) / 10 + 'b';
    } else if(num > 1000000) {
        return Math.round(num / 100000) / 10 + 'm';
    } else if(num > 1000) {
        return Math.round(num / 100) / 10 + 'k';
    } else {
        return num;
    }
};
