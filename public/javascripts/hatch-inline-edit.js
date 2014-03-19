(function ($) {
    'use strict';

    /**
     * Instantiate a new inline edit controller.
     */
    function InlineEditController() {

    }

    /**
     * Initialise inline editing for the current page.
     */
    InlineEditController.prototype.init = function() {
        function titleEdit() {
            var $el = $(this);
            var title = $el.text();

            if($('input', $el).length > 0) {
                return;
            }

            // replace with an input
            var input = $('<input type="text" value="' + title + '" />');
            $el.html(input);
            input.focus();
            input.selectRange(input.val().length, input.val().length);

            // save on enter
            input.bind('keypress', function(e) {
                if(e.which == 13) {
                    var title = input.val();

                    var $widget = $el.closest('.widget');
                    var widgetId = $widget.attr('data-id');

                    window.hatch.ajax.sendToWidget(widgetId, 'settitle', 'PUT', { title: title }, function (err, data) {
                        if(title) {
                            $el.html(title);
                        } else {
                            $el.remove();
                        }
                    });
                }
            });

            // revert on loss of focus
            input.bind('blur', function() {
                $el.html(title);
            });
        }

        function inlineEdit() {
            if ($(this).data('active')) return;
            $(this).data('active', true);

            var $el = $(this);
            var html = $el.data('html');
            if(typeof html == 'undefined' || !html) html = $el.html() || '';

            // replace the content with a textarea
            var textarea = $('<textarea>' + html + '</textarea>');
            $(textarea).css({ width: $(this).outerWidth() + 'px', height: $(this).outerHeight() + 80 + 'px' });

            var $saveButton = $('<button type="submit" class="btn btn-primary">Save changes</button>');
            var $cancelButton = $('<button class="btn">Cancel</button>');
            var $buttons = $('<div class="form-actions"></div>');

            $buttons.append($saveButton).append(" ").append($cancelButton);

            $(this).html(textarea);
            $(this).append($buttons);

            var destroyEditor = function() { };
             
            //attach the button events
            $cancelButton.bind('click', function() {
                //show notification
                $.noty({text: '<i class="icon-info-sign"></i> Widget contents have been reverted', type: 'alert'});

                //hide resize selectors
                $('.resize-selector, .resize-region').remove();

                $el.html(html); 
                $el.removeData('active');

                $el.hide().fadeIn();
            });

            $saveButton.bind('click', function() {
                // hide resize selectors
                $('.resize-selector, .resize-region').remove();

                // set the new html
                destroyEditor();
                $el.data('html', textarea.val());
                $el.html(textarea.val());
                $el.removeData('active');

                // trigger save to database
                var $widget = $el.parents('.widget');
                var widgetId = $widget.attr('id');

                window.hatch.ajax.sendToWidget(widgetId, 'update', 'PUT', {
                    _method: 'PUT',
                    perform: 'update',
                    'with': {
                        content: $el.data('html') || $el.html()
                    }
                }, function (err, data) {
                    $.noty({text: '<i class="fa fa-ok"></i> Widget contents updated', type: 'success'});
                });
            });

            // hack: clear any selection
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
            }
            else if (document.selection) {
                document.selection.empty();
            }

            function setupEditor() {
                var parent = $('<div></div>');
                var div = $('<div><div>');
                div.attr('id', new Date().getTime() + 'textarea');
                div.css({ height: '210px', width: $el.width() + 'px' });
                parent.css({ height: '200px'});

                parent.append(div);
                parent.insertAfter(textarea);
                textarea.hide();

                var editor = ace.edit(div[0].id);
                editor.setValue(textarea.val());
                editor.getSession().setMode('ace/mode/html');
                editor.clearSelection();

                destroyEditor = function () {
                    textarea.val(editor.getValue());
                };
            }

            // html editor - ACE
            if($el.hasClass('html')) {
                if(typeof ace == 'undefined') {
                    $.getScript('/javascripts/ace/ace.js', function() {
                        window.ace.config.set('basePath', '/javascripts/ace/');
                        setupEditor();
                    });
                }
                else {
                    setupEditor();
                }
            }
            // richtext editor - redactor
            else {
                var editor = window.hatch.page.setupRichtextEditor(textarea, {
                    autoresize : true,
                    css : 'inline.css',
                    minHeight : false
                });

                destroyEditor = function() {
                    editor.destroyEditor();
                };
            }

            return false;
        }

        $('body').on('dblclick', '.widget:not(.not-editable-widget) .inline-edit', inlineEdit);
        $('body').on('click', '.inline-edit-link', function() {
            var widget = $(this).parents('.widget');
            var content = $('.inline-edit', widget);

            inlineEdit.apply(content);

            return false;
        });

        $('body').on('dblclick', '.widget:not(.not-editable-widget) .content > h2', titleEdit);
    };

    // EXPORTS
    window.InlineEditController = InlineEditController;
})($);