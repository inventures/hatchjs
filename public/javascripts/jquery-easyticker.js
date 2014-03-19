/* 
 * jQuery - Easy Ticker plugin - v1.0
 * http://www.aakashweb.com/
 * Copyright 2012, Aakash Chakravarthy
 * Released under the MIT License.
 */

(function($){
    $.fn.easyTicker = function(options) {
    
    var defaults = {
        direction: 'up',
        easing: 'swing',
        speed: 'slow',
        interval: 2000,
        height: 'auto',
        visible: 0,
        mousePause: 1,
        controls:{
            up: '',
            down: '',
            toggle: ''
        }
    };
    
    // Initialize the variables
    var options = $.extend(defaults, options), 
        timer = 0,
        tClass = 'et-run',
        winFocus = 0,
        vBody = $('body'),
        cUp = $(options.controls.up),
        cDown = $(options.controls.down),
        cToggle = $(options.controls.toggle);
    
    // The initializing function
    var init = function(obj, target){
        
        target.children().css('margin', 0).children().css('margin', 0);
        
        obj.css({
            position : 'relative',
            height : (options.height == 'auto') ? objHeight(obj, target) : options.height,
            overflow : 'hidden'
        });
        
        target.css({
            'position' : 'absolute',
            'margin' : 0
        }).children().css('margin', 0);
        
        if(options.visible != 0 && options.height == 'auto'){
            adjHeight(obj, target);
        }

        // Set the class to the "toggle" control and set the timer.
        cToggle.addClass(tClass);
        setTimer(obj, target);
    }
    
    // Core function to move the element up and down.
    var move = function(obj, target, type){
        
        if(!obj.is(':visible')) return;
        
        if(type == 'up'){
            var sel = ':first-child',
                eq = '-=',
                appType = 'appendTo';
        }else{
            var sel = ':last-child',
                eq = '+=',
                appType = 'prependTo';
        }
    
        var selChild = $(target).children(sel);
        var height = selChild.outerHeight();
    
        $(target).stop(true, true).animate({
            'top': eq + height + "px"
        }, options.speed, options.easing, function(){
            selChild.hide()[appType](target).fadeIn();
            $(target).css('top', 0);
            if(options.visible != 0 && options.height == 'auto'){
                adjHeight(obj, target);
            }
        });
    }
    
    // Activates the timer.
    var setTimer = function(obj, target){
        if(cToggle.length == 0 || cToggle.hasClass(tClass)){
            timer = setInterval(function(){
                if (vBody.attr('data-focus') != 1){ return; }
                move(obj, target, options.direction);
            }, options.interval);
        }
    }
    
    // Stops the timer
    var stopTimer = function(obj){
        clearInterval(timer);
    }
    
    // Adjust the wrapper height and show the visible elements only.
    var adjHeight = function(obj, target){
        var wrapHeight = 0;
        $(target).children(':lt(' + options.visible + ')').each(function(){
            wrapHeight += $(this).outerHeight();
        });
        
        obj.stop(true, true).animate({height: wrapHeight}, options.speed);
    }
    
    // Get the maximum height of the children.
    var objHeight = function(obj, target){
        var height = 0;
        
        var tempDisp = obj.css('display');
        obj.css('display', 'block');
                
        $(target).children().each(function(){
            height += $(this).outerHeight();
        });
        
        obj.css('display', tempDisp);
        return height;
    }
    
    // Hack to check window status
    function onBlur(){ vBody.attr('data-focus', 0); };
    function onFocus(){ vBody.attr('data-focus', 1); };
    
    if (/*@cc_on!@*/false) { // check for Internet Explorer
        document.onfocusin = onFocus;
        document.onfocusout = onBlur;
    }else{
        $(window).bind('focus mouseover', onFocus);
        $(window).bind('blur', onBlur);
    }

    return this.each(function(){
        var obj = $(this);
        var tar = obj.children(':first-child');
        
        // Initialize the content
        init(obj, tar);
        
        // Bind the mousePause action
        if(options.mousePause == 1){
            obj.mouseover(function(){
                stopTimer(obj);
            }).mouseleave(function(){
                setTimer(obj, tar);
            });
        }
        
        // Controls action
        cToggle.live('click', function(){
            if($(this).hasClass(tClass)){
                stopTimer(obj);
                $(this).removeClass(tClass);
            }else{
                $(this).addClass(tClass);
                setTimer(obj, tar);
            }
        });
        
        cUp.live('click', function(){
            move(obj, tar, 'up');
        });
        
        cDown.live('click', function(){
            move(obj, tar, 'down');
        });
        
    });
};
})(jQuery);