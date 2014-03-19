;(function ($) {
    'use strict';

    /**
     * Defines the client-side Hatch application.
     * 
     * @param {Object} options - setup options
     */
    function Hatch (options) {
        this.options = options || {};
    }

    /**
     * Initialise the page after loading via PJAX.
     */
    Hatch.prototype.init = function () {
        var self = this;
        
        // setup the page, widget, ajax and upload controllers
        this.ajax = new AjaxController();
        this.upload = new UploadController();
        this.page = new PageController(this.options);
        this.widget = new WidgetController();
        
        this.ajax.init();
        this.upload.init();
        this.page.init();
        this.widget.init();

        // initialise PJAX, but only allow for browsers that support replaceState
        self.initPjax();

        // setup ajax modals
        $(document).on('ajax:success', 'a[data-modal]', function (e, html) {
            var modal = $(html);
            var $modalContainer = $("#modal-container");

            if($modalContainer.length === 0) {
                $modalContainer = $('<div id="modal-container"></div>').appendTo($('body'));
            }
            
            // display the modal dialog with the contents from the ajax request
            $modalContainer.empty().append(modal);
            modal.modal('show');

            window.hatch.setupModal();
        });

        // setup autogrow textarea
        $('.autogrow-shadow').remove();
        $('textarea[rel*=autogrow]').autogrow({ animate: false });

        // submit on enter textareas
        $('body').on('keypress', 'textarea[rel*=submitenter]', function(e) {
            if (e.charCode === 13 && !e.shiftKey) {
                $(this).parents('form').submit();
                return false;
            }
        });

        // submit on cmd/ctrl-enter
        $('textarea[rel*=submitcommandenter]').on('focus', function() {
            var textarea = this;
            $(window).unbind('keydown').bind('keydown', function(e) {
                if (e.keyCode === 13 && (e.metaKey || e.ctrlKey)) {
                    $(textarea).parents('form').submit();
                }
            });
        });
        $('textarea[rel*=submitcommandenter]').on('blur', function() {
            $(window).unbind('keydown');
        });
    };

    /**
     * Setup the modal dialog after it loads.
     */
    Hatch.prototype.setupModal = function () {
        if ($.fn.chosen) {
            $('.modal-body .chzn-select-create').chosen({ create_option: true });
            $('.modal-body .chzn-select').chosen();
        }
    };

    /**
     * Generate a path to the specified REST action.
     * 
     * @param  {String} action - REST action name
     * @return {String}
     */
    Hatch.prototype.pathTo = function (action) {
        var path = (window.location.pathname + '/do/' + action).replace('//', '/');
        return path;
    };

    /**
     * Initialise PJAX for the application.
     */
    Hatch.prototype.initPjax = function () {
        var self = this;

        if (window.history.replaceState && $('.no-pjax').length === 0) {
            $.pjax.enable();
            $.pjax.defaults.headers = { 'Content-Type' : '' };
            $.pjax.defaults.dataType = '';

            $('#pjax-body').pjax('#main .nav a:not([rel=nopjax]), #main .breadcrumb a:not([rel=nopjax]), #main .sub-menu a, .pjax');
            $('#pjax-body').on('pjax:end', function() { window.hatch.page.init(); });
        }
    };

    /**
     * Check whether a widget's events have been bound.
     * 
     * @param  {String}  id - widget identifier
     * @return {Boolean}
     */
    Hatch.prototype.checkBound = function (id) {
        if (!this.bound) {
            this.bound = {};
        }

        var result = this.bound[id];
        this.bound[id] = true;
        return result;
    };

    // EXPORTS
    window.Hatch = Hatch;
})($);