(function( $ ) {
  $.fn.blink = function(className) {
    var count = 0, $el = $(this), interval = setInterval(function() {
        if ($el.hasClass(className)) {
          $el.removeClass(className); ++count;
        }
        else
          $el.addClass(className);
    
        if (count === 3) clearInterval(interval);
    }, 300);
  };
})( jQuery );