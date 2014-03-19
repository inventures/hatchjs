;(function ($) {
	'use strict';

	/**
	 * Instantiate a new edit console.
	 */
	function EditConsoleController () {
        var self = this;

        if (!window.hatch.checkBound('editconsole')) {
            $(document).on('click', '.edit-console .widget a', function () {
                self.createWidget(this.href.split('#')[1], 1, 0);
                return false;
            });
        }
	}

	/**
	 * Toggle the visibility of the edit console.
	 * 
	 * @param  {Boolean} show - force show
	 */
	EditConsoleController.prototype.toggle = function(show) {
        if (typeof show === 'undefined') {
            show = !$('.edit-console').is(':visible');
        }

        //set the cookie
        $.cookie('edit-console-visible', show, { path : '/' });

        if (show) {
            this.show();
        } else {
            this.hide();
        }
    };

    /**
     * Hide the edit console.
     */
    EditConsoleController.prototype.hide = function () {
        $('#edit-page-link i.fa-eye').show();
        $('#edit-page-link i.fa-eye-slash').hide();

        //set the cookie
        $.cookie('edit-console-visible', null, { path : '/' });

        $('.edit-console').fadeOut();
    };

    /**
     * Show the edit console.
     */
    EditConsoleController.prototype.show = function() {
        var self = this;

        $('#edit-page-link i.fa-eye-slash').show();
        $('#edit-page-link i.fa-eye').hide();

        if ($('#editConsole').length === 0) {
            $('#editConsoleHolder').load(window.hatch.pathTo('admin/page/editconsole'), function() {
                $('.edit-console').fadeIn();

                //set the position
                self.position();

                //allow widget dragging
                $('#edit-console-widgets li span.widget').draggable({
                    appendTo: 'body',
                    helper: function() {
                        return $('<div class="drag-helper">' + $(this).html() + '</div>');
                    },
                    connectToSortable: '.widget-list.editable',
                    stop: function() {
                        var widget = $('a', this).attr('href').replace('#', '');
                        var $placeholder = $('.widget-list .widget.ui-draggable');

                        var row = $placeholder.index();
                        var col = $placeholder.parent().attr('id');

                        //if we don't have a column, give up
                        if (!col) {
                            return;
                        }

                        col = col.replace('col-', '');

                        //remove the placeholder
                        $placeholder.remove();

                        //add the new widget
                        self.createWidget(widget, col, row);
                    }
                });

                //initialise style editor
                var styleeditor = new StyleEditorController();
                styleeditor.init();

                //attach events
                $('.edit-console .close').bind('click', self.hide);
                $('.edit-console').draggable({
                    handle: 'div.console-header',
                    stop: function() {
                        $.cookie('edit-console-xy', JSON.stringify($('.edit-console').position()), { path : '/' });
                    }
                });
                $('#column-layout-choices input').bind('click', function() {
                    $('#templates-layouts, #columns-layouts').hide();
                    $('#' + this.value + '-layouts').show();
                });
            });
        }
        else {
            $('#editConsole').fadeIn();
            self.position();

            //reload the layouts tab
            $('#edit-console-layouts').load(window.hatch.pathTo('admin/page/editconsole?tab=layouts'));
        }
    };

    /**
     * Position the edit console using the value stored in the edit-console-xy cookie.
     */
    EditConsoleController.prototype.position = function() {
        //position the edit console
        var editConsolePosition = $.cookie('edit-console-xy');
        if (editConsolePosition) {
            editConsolePosition = JSON.parse(editConsolePosition);

            //make sure the position is within the bounds of the window
            if (editConsolePosition.left + $('.edit-console').outerWidth() > $(window).width()) {
                editConsolePosition.left = Math.max(0, $(window).width() - $('.edit-console').outerWidth());
            }

            if (editConsolePosition.top + $('.edit-console').outerHeight() > $(window).height()) {
                editConsolePosition.top = Math.max(0, $(window).height() - $('.edit-console').outerHeight());
            }

            $('.edit-console').css({left: editConsolePosition.left + 'px', top: editConsolePosition.top + 'px'});
        }
    };

    /**
     * Create a widget and add it to the page in the specified position.
     * 
     * @param  {String} type - widget type
     * @param  {Number} col  - column number
     * @param  {Number} row  - row number
     */
    EditConsoleController.prototype.createWidget = function (type, col, row) {
        var name = type.split('/').pop();
        window.hatch.ajax.sendToWidget(null, null, 'POST', {addWidget: type}, function (err, data) {
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

                    window.hatch.dragdrop.saveWidgets(true);
                    window.hatch.dragdrop.makeModulesDraggable();
                }
            }
        });
        return false;
    };

    /**
     * Change the grid to the specified type.
     * 
     * @param  {String}      type - grid type
     * @param  {HTMLElement} el   - element defining the grid
     */
    EditConsoleController.prototype.selectGrid = function (type, el) {
        $(el).parent().find('li.selected-grid').removeClass('selected-grid');
        $('#templates-layouts input').attr("checked", null);

        window.hatch.ajax.send('admin/page/grid', 'POST', {grid: type}, function (err, data) {
            $('.widget-list:first').closest('#row-content').html(data.html);

            //re-intialise the dragdrop
            window.hatch.dragdrop.init();

            //display notification
            $.noty({
                text: "<i class='icon-ok'></i> Page layout changed", 
                type: "success"
            });

            $(el).addClass('selected-grid');
        });

        return false;
    };

    // EXPORTS
    window.EditConsoleController = EditConsoleController;
})($);