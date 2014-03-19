;(function($) {
	'use strict';

	function PageController (options) {
		this.options = options || {};
	}

	/**
	 * Initialise the page.
	 */
	PageController.prototype.init = function () {
		var self = this;

        // setup the admin controllers
        if (this.options.admin) {
            window.hatch.dragdrop = new DragDropController();
            window.hatch.inlineedit = new InlineEditController();
        }

        // setup the chosen select boxes
        if ($.fn.chosen) {
            $(".content .chzn-select-create").chosen({
                create_option: true,
                create_option_text: 'Press enter to add'
            });
            $('.content .chzn-select').chosen();
        }

        //check to see if we should launch a modal
        if (window.location.hash && window.location.hash.length > 1) {
            if (window.location.hash.indexOf('/') > -1) return;

            try {
                var el = $(window.location.hash);

                if (el.hasClass('modal')) {
                    el.modal();
                }
            } catch(ex) {
                // ignore errors
            }
        }

        // setup the mouseover navbar
        $('.navbar-type-mouseover')
            .css({ opacity: 0, marginTop: '-30px' })
            .hoverIntent(
                function() {
                    $(this).animate({ opacity: 1, marginTop: '0px' });
                },
                function() {
                    $(this).animate({ opacity: 0, marginTop: '-30px' });
                }
        );

        // setup the mouseclick navbar
        $('.navbar-type-click')
            .css({ opacity: 0, marginTop: '-30px' })
            .click(function() {
                $(this).animate({ opacity: 1, marginTop: '0px' });
            })
            .hoverIntent(
            function() { },
            function() {
                $(this).animate({ opacity: 0, marginTop: '-30px' });
            }
        );

        // kill the typeahead menu - if any
        $('.typeahead.dropdown-menu').remove();

        // setup popup window links
        $('a[rel=popup]').on('click', function() {
            window.open(this.href, '_popup', 'status = 1, height = 400, width = 600, resizable = 0');
            return false;
        });

        var isTouchDevice = 'ontouchstart' in document.documentElement;

        // only do certain things for non-mobile
        if (!isTouchDevice) {
            // setup editing functionality
            if (this.options.admin) {
                if ($('#editConsoleHolder').length > 0) {
                    //initialise drag and drop
                    window.hatch.dragdrop.init();
                }

                // setup inline editing
                window.hatch.inlineedit.init();

                // setup the widget settings
                $(document).on('show.bs.modal', '#modal-container', function() {
                    if ($('#modal-settings').length === 0) {
                        return;
                    }

                    $('a[rel=widget-privacy]').bind('click', function() {
                        var value = JSON.parse($(this).attr('data-value'));
                        var input = $('#privacy');
                        var el = $('#widget-privacy');

                        el.find('.btn').text(value.name);
                        el.find('.btn').removeClass('btn-success btn-warning btn-danger').addClass('btn-' + value['class']);
                        input.val(value.value);

                        //close the dropdown
                        el.removeClass('open');

                        return false;
                    });

                    $('a[rel=widget-visibility]').bind('click', function() {
                        var value = JSON.parse($(this).attr('data-value'));
                        var input = $('#visibility');
                        var el = $('#widget-visibility');

                        el.find('.btn').text(value.name);
                        el.find('.btn').removeClass('btn-success btn-warning btn-danger').addClass('btn-' + value['class']);
                        input.val(value.value);

                        //close the dropdown
                        el.removeClass('open');

                        return false;
                    });
                });

                // create the edit console
                window.hatch.editConsole = new EditConsoleController();

                // show the edit console?
                if ($('#editConsoleHolder').length > 0 && $.cookie('edit-console-visible')) {
                    window.hatch.editConsole.toggle(true);
                }

                // edit console link
                $('#edit-page-link').click(function () {
                    window.hatch.editConsole.toggle();
                    return false;
                });
            }
        }
        // touch/mobile === true
        else {
            // set a timeout...
            setTimeout(function(){
                // Hide the address bar!
                window.scrollTo(0, 1);
            }, 0);

            // set a body class
            $('body').addClass('touch-screen');
        }


        $('a.dropdown-toggle, .dropdown-menu a').on('touchstart', function(e) {
            e.stopPropagation();
        });

        // fix sub nav on scroll
        var $win = $(window);
        var $nav = $('.subnav.fixed-top');
        var navHeight = ($('body.navbar-fixed').length > 0 && $('.navbar.navbar-fixed-top').height() || 0);
        var navTop = $('.subnav').length && $('.subnav').offset().top - navHeight;
        var isFixed = 0;

        function processScroll() {
            var i, scrollTop = $win.scrollTop();
            if (scrollTop >= navTop && !isFixed) {
                isFixed = 1;
                $nav.addClass('subnav-fixed');
                $nav.css({ top: navHeight + 'px' });
            } else if (scrollTop <= navTop && isFixed) {
                isFixed = 0;
                $nav.removeClass('subnav-fixed');
                $nav.css({ top: 'auto' });
            }
        }

        if ($nav.length > 0) {
            processScroll();

            $win.on('scroll', processScroll);
        }

        this.setupRichtextEditors();
	};

	/**
     * Setup all of the richtext editors on the page.
     * 
     * @param  {String} selector - optional: specify a selector for the richtext editors
     */
    PageController.prototype.setupRichtextEditors = function (selector, options) {
        var self = this;

        if (!selector) {
            selector = '.richtext';
        }

        if (!options) {
            options = {};
        }

        //convert richtexts
        $(selector).each(function(i, el) {
            if ($(el).data('redactor')) {
                return;
            }

            var editor = self.setupRichtextEditor(el, options);
        });

        //tie up the form events for richtext
        $(selector).each(function(i, el) {
            //get the form
            var form = el.form;
            var $el = $(el);
            $(form).bind('submit', function() {
                if ($el.getCode) {
                    $el.val($el.getCode());
                }
            });
        });
    };

    /**
     * Setup a richtext editor.
     * 
     * @param  {String} selector - selector to identify the richtext editor.
     * @param  {Object} options  - redactor options
     */
    PageController.prototype.setupRichtextEditor = function (selector, options) {
        var self = this;
        var el = $(selector);

        //create the redactor modal
        window.$redactorModal = $('#redactor-modal');

        if (window.$redactorModal.length === 0) {
            window.$redactorModal = $('<div class="modal" id="redactor-modal" style="display: none;"></div>').appendTo($('body'));
        }

        if (typeof RLANG === 'undefined') {
            if (console) {
                console.error('RLANG is not defined');
            }

            return;
        }

        RLANG.image = 'Edit image';

        var editor = $(el).redactor($.extend({
            focus : false,
            minHeight : $(el).height() -30,
            convertDivs : false,
            fixed: false,
            modal_image_edit: '<label>' + RLANG.title + '</label>' +
                '<input id="redactor_file_alt" type="text" class="redactor_input" />' +
                '<label>' + RLANG.image_position + '</label>' +
                '<select id="redactor_form_image_align">' +
                '<option value="none">' + RLANG.none + '</option>' +
                '<option value="left">' + RLANG.left + '</option>' +
                '<option value="right">' + RLANG.right + '</option>' +
                '</select>' +
                '<div id="redactor_modal_footer" style="overflow: visible;">' +
                '<div class="modal-footer" style="margin: 0 -30px -20px; padding: 15px 23px;">' +
                '<div class="btn-toolbar pull-left" style="margin : 0;">' +
                '<div class="btn-group">' +
                '<a href="javascript:void(null);" id="redactor_image_delete_btn" style="color: #000;" class="btn">' + RLANG._delete + '</a>' +
                '</div>' +
                '</div>' +
                '<div class="btn-toolbar" style="margin : 0;">' +
                '<div class="btn-group">' +
                '<button type="button" name="save" id="redactorSaveBtn" class="btn btn-primary">' + RLANG.save + '</button>' +
                '</div>' +
                '<div class="btn-group">' +
                '<a href="javascript:void(null);" id="redactor_btn_modal_close" class="btn">' + RLANG.cancel + '</a>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '</div>',
            buttonsCustom: {
                //override the image button
                image: {
                    title: 'Insert image...',
                    callback: function(obj, event, key) {
                        editor.data('redactor').saveSelection();
                        window.redactor = editor;
                        window.$redactorModal.load(window.hatch.pathTo('admin/page/image'), {
                            success: function() {
                                window.$redactorModal.modal();
                            }
                        });
                    }
                },
                //override the link button
                link: {
                    title: 'Link',
                    callback: function(obj, event, key) {
                        editor.data('redactor').saveSelection();
                        window.redactor = editor;
                        window.$redactorModal.load(window.hatch.pathTo('admin/page/link'), {
                            success: function() {
                                window.$redactorModal.modal();
                            }
                        });
                    }
                }
            }
        }, options || {}));

        editor.after('<div class="clearfix"></div>');

        return editor;
    };

	// EXPORTS
	window.PageController = PageController;
})($);