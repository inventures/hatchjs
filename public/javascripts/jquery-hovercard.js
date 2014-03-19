(function ($) {
    var $hovercard = $('<div id="hovercard" class="hovercard" style="display : none; position: absolute;"><div class="arrow"></div><div class="content"></div></div>');
    var MARGIN = 10;

    $(document).ready(function() {
        $('body').append($hovercard);

        $hovercard.bind('mouseover', function() {
            cancelHide(this);
        });
        $hovercard.bind('mouseout', function() {
            hideHovercard(this);
        })
    });

    function hideHovercard(el) {
        //only allow control of the hovercard from the last element that requested it
        if(el != window.hovercardActiveEl) return;

        window.hideHovercard = true;
        window.hideHovercardFn = window.setTimeout(function() {
            if(window.hideHovercard) {
                $hovercard.hide();
            }
        }, 500)
    }

    function cancelHide(el) {
        window.hovercardActiveEl = el;
        window.hideHovercard = false;
        window.clearTimeout(window.hideHovercardFn);
        window.hideHovercardFn = null;

        //just in case the hoverIntent out events fire in the wrong order
        setTimeout(function() { window.hideHovercard = false; }, 10);
    }

    $.fn.hovercard = function (options) {
        $(this).hoverIntent({
            timeout: 40,
            over: function() {
                window.hovercardActiveEl = this;
                var el = $(this);
                cancelHide(this);

                $hovercard.find('.content').load($(this).attr('data-url'), function() {
                    $hovercard.show();
                    $hovercard.removeClass('right').css({ left: el.offset().left + 'px', top: (el.offset().top - $hovercard.outerHeight() - MARGIN) + 'px' });

                    if($hovercard.position().left + $hovercard.outerWidth() > $(window).width()) {
                        $hovercard.addClass('right');
                        $hovercard.css({ left: el.offset().left - $hovercard.outerWidth() + 45 + 'px' });
                    }
                });
            },
            out: function() {
                hideHovercard(this);
            }
        });
    };
})(jQuery);