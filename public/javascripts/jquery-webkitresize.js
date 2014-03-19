/* 
* Webkitresize (http://editorboost.net/webkitresize)
* Copyright 2012 Editorboost. All rights reserved. 
*
* Webkitresize commercial licenses may be obtained at http://editorboost.net/webkitresize/licenses.
* If you do not own a commercial license, this file shall be governed by the
* GNU General Public License (GPL) version 3. For GPL requirements, please
* review: http://www.gnu.org/copyleft/gpl.html
*
* REQUIRES: jquery 1.7.1+
*/

; (function ($) {
    $.fn.webkitimageresize = function (options) {
        return this.each(function () {

            if (!$.browser.webkit) {
                return;
            }


            var settings = $.extend({
            }, options);

            var lastCrc;
            var imageResizeinProgress = false;
            var currentImage;

            var methods = {

                removeResizeElements: function (context) {
                    $(".resize-selector").remove();
                    $(".resize-region").remove();
                },

                imageClick: function (context, img) {
                    if (settings.beforeElementSelect) {
                        settings.beforeElementSelect(img);
                    }

                    methods.removeResizeElements();
                    currentImage = img;

                    var imgHeight = $(img).outerHeight();
                    var imgWidth = $(img).outerWidth();
                    var iframePos = context.$ifrm.offset();
                    var imgPosition = $(img).offset();
                    var ifrmScrollTop = context.$ifrmBody.scrollTop();
                    var ifrmScrollLeft = context.$ifrmBody.scrollLeft();
                    
                    context.$docBody.append("<span class='resize-selector' style='margin:10px;position:absolute;top:" + (iframePos.top  + imgPosition.top - ifrmScrollTop + imgHeight - 10) + "px;left:" + (iframePos.left + imgPosition.left - ifrmScrollLeft + imgWidth - 10) + "px;border:solid 2px blue;;width:6px;height:6px;cursor:se-resize;z-index:1;'></span>");

                    context.$docBody.append("<span class='resize-region region-top-right' style='position:absolute;top:" + (iframePos.top + imgPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + imgPosition.left - ifrmScrollLeft) + "px;border:solid 1px blue;;width:" + imgWidth + "px;height:0px;'></span>");
                    context.$docBody.append("<span class='resize-region region-top-down' style='position:absolute;top:" + (iframePos.top + imgPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + imgPosition.left - ifrmScrollLeft) + "px;border:solid 1px blue;;width:0px;height:" + imgHeight + "px;'></span>");

                    context.$docBody.append("<span class='resize-region region-right-down' style='position:absolute;top:" + (iframePos.top + imgPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + imgPosition.left - ifrmScrollLeft + imgWidth) + "px;border:solid 1px blue;;width:0px;height:" + imgHeight + "px;'></span>");
                    context.$docBody.append("<span class='resize-region region-down-left' style='position:absolute;top:" + (iframePos.top + imgPosition.top - ifrmScrollTop + imgHeight) + "px;left:" + (iframePos.left + imgPosition.left - ifrmScrollLeft) + "px;border:solid 1px blue;;width:" + imgWidth + "px;height:0px;'></span>");


                    var dragStop = function () {
                        if (imageResizeinProgress) {
                            $(currentImage)
                                .css("width", $(".region-top-right").width() + "px")
                                .css('height', $(".region-top-down").height() + "px");
                            methods.refresh(context);
                            $(currentImage).click();

                            $(document).trigger('webkitresize-updatecrc', [methods.crc(context.$ifrmBody.html())]);

                            imageResizeinProgress = false;

                            if (settings.afterResize) {
                                settings.afterResize(currentImage);
                            }
                        }
                    };

                    var iframeMouseMove = function (e) {
                        if (imageResizeinProgress) {

                            var resWidth = imgWidth;
                            var resHeight = imgHeight;

                            resHeight = e.pageY - imgPosition.top;
                            resWidth = e.pageX - imgPosition.left;

                            if (resHeight < 1) {
                                resHeight = 1;
                            }
                            if (resWidth < 1) {
                                resWidth = 1;
                            }

                            $(".resize-selector").css("top", (iframePos.top + imgPosition.top - ifrmScrollTop + resHeight - 10) + 'px').css("left", (iframePos.left + imgPosition.left - ifrmScrollLeft + resWidth - 10) + "px");
                            $(".region-top-right").css("width", resWidth + "px");
                            $(".region-top-down").css("height", resHeight + "px");

                            $(".region-right-down").css("left", (iframePos.left + imgPosition.left - ifrmScrollLeft + resWidth) + "px").css("height", resHeight + "px");
                            $(".region-down-left").css("top", (iframePos.top + imgPosition.top - ifrmScrollTop + resHeight) + "px").css("width", resWidth + "px");
                        }

                        return false;
                    };


                    var windowMouseMove = function (e) {
                        if (imageResizeinProgress) {

                            var resWidth = imgWidth;
                            var resHeight = imgHeight;

                            resHeight = e.pageY - (iframePos.top + imgPosition.top - ifrmScrollTop);
                            resWidth = e.pageX - (iframePos.left + imgPosition.left - ifrmScrollLeft);

                            if (resHeight < 1) {
                                resHeight = 1;
                            }
                            if (resWidth < 1) {
                                resWidth = 1;
                            }

                            $(".resize-selector").css("top", (iframePos.top + imgPosition.top - ifrmScrollTop + resHeight - 10) + 'px').css("left", (iframePos.left + imgPosition.left - ifrmScrollLeft + resWidth - 10) + "px");
                            $(".region-top-right").css("width", resWidth + "px");
                            $(".region-top-down").css("height", resHeight + "px");

                            $(".region-right-down").css("left", (iframePos.left + imgPosition.left - ifrmScrollLeft + resWidth) + "px").css("height", resHeight + "px");
                            $(".region-down-left").css("top", (iframePos.top + imgPosition.top - ifrmScrollTop + resHeight) + "px").css("width", resWidth + "px");
                        }

                        return false;
                    };

                    $(".resize-selector").mousedown(function (e) {
                        if (settings.beforeResizeStart) {
                            settings.beforeResizeStart(currentImage);
                        }
                        imageResizeinProgress = true;
                        return false;
                    });

                    $("*").mouseup(function () {
                        if (imageResizeinProgress) {
                            dragStop();
                        }
                    });

                    $(context.ifrm.contentWindow).mousemove(function (e) {
                        iframeMouseMove(e);
                    });

                    $(window).mousemove(function (e) {
                        windowMouseMove(e);
                    });

                    if (settings.afterElementSelect) {
                        settings.afterElementSelect(currentImage);
                    }
                },

                rebind: function (context) {
                    context.$ifrmBody.contents().find("img").each(function (i, v) {
                        $(v).unbind('click');
                        $(v).click(function (e) {
                            if(e.target == v){
                                methods.imageClick(context, v);
                            }
                        });
                    });
                },

                refresh: function (context) {
                    methods.rebind(context);

                    methods.removeResizeElements();

                    if (!currentImage) {
                        if (settings.afterRefresh) {
                            settings.afterRefresh(null);
                        }
                        return;
                    }

                    var img = currentImage;

                    var imgHeight = $(img).outerHeight();
                    var imgWidth = $(img).outerWidth();
                    var iframePos = context.$ifrm.offset();
                    var imgPosition = $(img).offset();
                    var ifrmScrollTop = context.$ifrmBody.scrollTop();
                    var ifrmScrollLeft = context.$ifrmBody.scrollLeft();

                    context.$docBody.append("<span class='resize-selector' style='position:absolute;top:" + (iframePos.top + imgPosition.top - ifrmScrollTop + imgHeight) + "px;left:" + (iframePos.left + imgPosition.left - ifrmScrollLeft + imgWidth) + "px;border:solid 2px red;;width:6px;height:6px;cursor:se-resize;z-index:1;'></span>");

                    context.$docBody.append("<span class='resize-region' style='position:absolute;top:" + (iframePos.top + imgPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + imgPosition.left - ifrmScrollLeft) + "px;border:dashed 1px grey;;width:" + imgWidth + "px;height:0px;'></span>");
                    context.$docBody.append("<span class='resize-region' style='position:absolute;top:" + (iframePos.top + imgPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + imgPosition.left - ifrmScrollLeft) + "px;border:dashed 1px grey;;width:0px;height:" + imgHeight + "px;'></span>");

                    context.$docBody.append("<span class='resize-region' style='position:absolute;top:" + (iframePos.top + imgPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + imgPosition.left - ifrmScrollLeft + imgWidth) + "px;border:dashed 1px grey;;width:0px;height:" + imgHeight + "px;'></span>");
                    context.$docBody.append("<span class='resize-region' style='position:absolute;top:" + (iframePos.top + imgPosition.top - ifrmScrollTop + imgHeight) + "px;left:" + (iframePos.left + imgPosition.left - ifrmScrollLeft) + "px;border:dashed 1px grey;;width:" + imgWidth + "px;height:0px;'></span>");

                    lastCrc = methods.crc(context.$ifrmBody.html());

                    if (settings.afterRefresh) {
                        settings.afterRefresh(currentImage);
                    }
                },

                reset: function (context) {
                    currentImage = null;
                    imageResizeinProgress = false;
                    methods.removeResizeElements();
                    methods.rebind(context);

                    lastCrc = methods.crc(context.$ifrmBody.html());
                    if (settings.afterReset) {
                        settings.afterReset();
                    }
                },

                crc: function (str) {
                    var hash = 0;
                    if (!str || str.length == 0) return hash;
                    for (i = 0; i < str.length; i++) {
                        char = str.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash;
                    }
                    return hash;
                }
            };

            var ifrm = this;
            var $ifrm = $(this);
            var $docBody = $("body");
            var $ifrmBody = $ifrm.contents().find("body");

            lastCrc = methods.crc($ifrmBody.html());

            if (!$ifrm.is('iframe')) {
                return;
            }

            var context = {
                ifrm: ifrm,
                $ifrm: $ifrm,
                $docBody: $docBody,
                $ifrmBody: $ifrmBody
            };

            ifrm.contentWindow.addEventListener('scroll', function () {
                methods.reset(context);
            }, false);

            $(ifrm.contentWindow.document).keyup(function () {
                if (!imageResizeinProgress) {
                    methods.reset(context);
                }
            }).mouseup(function (e) {
                if (lastCrc != methods.crc($ifrmBody.html())) {
                    methods.reset(context);
                }
                else {
                    var x = (e.x) ? e.x : e.clientX;
                    var y = (e.y) ? e.y : e.clientY;
                    var mouseUpElement = ifrm.contentWindow.document.elementFromPoint(x, y);
                    if (mouseUpElement) {
                        if (!$(mouseUpElement).is("img")) {
                            methods.reset(context);
                        }
                    }
                    else {
                        methods.reset(context);
                    }
                }
            });

            $(document).keyup(function (e) {
                if (e.keyCode == 27) {
                    methods.reset(context);
                }
            });

            setInterval(function () {
                if (!imageResizeinProgress && lastCrc != methods.crc($ifrmBody.html())) {
                    methods.reset(context);
                }
            }, 1000);

            $(document).bind('webkitresize-updatecrc', function (event, crc) {
                lastCrc = crc;
            });

            methods.refresh(context);

        });
    };


    $.fn.webkittableresize = function (options) {
        return this.each(function () {

            if (!$.browser.webkit) {
                return;
            }


            var settings = $.extend({
            }, options);

            var lastCrc;
            var tableResizeinProgress = false;
            var currenttable;

            var methods = {

                removeResizeElements: function (context) {
                    $(".resize-selector").remove();
                    $(".resize-region").remove();
                },

                tableClick: function (context, tbl) {
                    if (settings.beforeElementSelect) {
                        settings.beforeElementSelect(tbl);
                    }

                    methods.removeResizeElements();
                    currenttable = tbl;

                    var tblHeight = $(tbl).outerHeight();
                    var tblWidth = $(tbl).outerWidth();
                    var iframePos = context.$ifrm.offset();
                    var tblPosition = $(tbl).offset();
                    var ifrmScrollTop = context.$ifrmBody.scrollTop();
                    var ifrmScrollLeft = context.$ifrmBody.scrollLeft();

                    context.$docBody.append("<span class='resize-selector' style='margin:10px;position:absolute;top:" + (iframePos.top + tblPosition.top - ifrmScrollTop + tblHeight - 10) + "px;left:" + (iframePos.left + tblPosition.left - ifrmScrollLeft + tblWidth - 10) + "px;border:solid 2px red;;width:6px;height:6px;cursor:se-resize;z-index:1;'></span>");

                    context.$docBody.append("<span class='resize-region region-top-right' style='position:absolute;top:" + (iframePos.top + tblPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + tblPosition.left - ifrmScrollLeft) + "px;border:dashed 1px grey;;width:" + tblWidth + "px;height:0px;'></span>");
                    context.$docBody.append("<span class='resize-region region-top-down' style='position:absolute;top:" + (iframePos.top + tblPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + tblPosition.left - ifrmScrollLeft) + "px;border:dashed 1px grey;;width:0px;height:" + tblHeight + "px;'></span>");

                    context.$docBody.append("<span class='resize-region region-right-down' style='position:absolute;top:" + (iframePos.top + tblPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + tblPosition.left - ifrmScrollLeft + tblWidth) + "px;border:dashed 1px grey;;width:0px;height:" + tblHeight + "px;'></span>");
                    context.$docBody.append("<span class='resize-region region-down-left' style='position:absolute;top:" + (iframePos.top + tblPosition.top - ifrmScrollTop + tblHeight) + "px;left:" + (iframePos.left + tblPosition.left - ifrmScrollLeft) + "px;border:dashed 1px grey;;width:" + tblWidth + "px;height:0px;'></span>");


                    var dragStop = function () {
                        if (tableResizeinProgress) {
                            $(currenttable)
                                .css("width", $(".region-top-right").width() + "px")
                                .css('height', $(".region-top-down").height() + "px");
                            methods.refresh(context);
                            $(currenttable).click();

                            $(document).trigger('webkitresize-updatecrc', [methods.crc(context.$ifrmBody.html())]);

                            tableResizeinProgress = false;

                            if (settings.afterResize) {
                                settings.afterResize(currenttable);
                            }
                        }
                    };

                    var iframeMouseMove = function (e) {
                        if (tableResizeinProgress) {

                            var resWidth = tblWidth;
                            var resHeight = tblHeight;

                            resHeight = e.pageY - tblPosition.top;
                            resWidth = e.pageX - tblPosition.left;

                            if (resHeight < 1) {
                                resHeight = 1;
                            }
                            if (resWidth < 1) {
                                resWidth = 1;
                            }

                            $(".resize-selector").css("top", (iframePos.top + tblPosition.top - ifrmScrollTop + resHeight - 10) + 'px').css("left", (iframePos.left + tblPosition.left - ifrmScrollLeft + resWidth - 10) + "px");
                            $(".region-top-right").css("width", resWidth + "px");
                            $(".region-top-down").css("height", resHeight + "px");

                            $(".region-right-down").css("left", (iframePos.left + tblPosition.left - ifrmScrollLeft + resWidth) + "px").css("height", resHeight + "px");
                            $(".region-down-left").css("top", (iframePos.top + tblPosition.top - ifrmScrollTop + resHeight) + "px").css("width", resWidth + "px");
                        }

                        return false;
                    };


                    var windowMouseMove = function (e) {
                        if (tableResizeinProgress) {

                            var resWidth = tblWidth;
                            var resHeight = tblHeight;

                            resHeight = e.pageY - (iframePos.top + tblPosition.top - ifrmScrollTop);
                            resWidth = e.pageX - (iframePos.left + tblPosition.left - ifrmScrollLeft);

                            if (resHeight < 1) {
                                resHeight = 1;
                            }
                            if (resWidth < 1) {
                                resWidth = 1;
                            }

                            $(".resize-selector").css("top", (iframePos.top + tblPosition.top - ifrmScrollTop + resHeight - 10) + 'px').css("left", (iframePos.left + tblPosition.left - ifrmScrollLeft + resWidth - 10) + "px");
                            $(".region-top-right").css("width", resWidth + "px");
                            $(".region-top-down").css("height", resHeight + "px");

                            $(".region-right-down").css("left", (iframePos.left + tblPosition.left - ifrmScrollLeft + resWidth) + "px").css("height", resHeight + "px");
                            $(".region-down-left").css("top", (iframePos.top + tblPosition.top - ifrmScrollTop + resHeight) + "px").css("width", resWidth + "px");
                        }

                        return false;
                    };

                    $(".resize-selector").mousedown(function (e) {
                        if (settings.beforeResizeStart) {
                            settings.beforeResizeStart(currenttable);
                        }
                        tableResizeinProgress = true;
                        return false;
                    });

                    $("*").mouseup(function () {
                        if (tableResizeinProgress) {
                            dragStop();
                        }
                    });

                    $(context.ifrm.contentWindow).mousemove(function (e) {
                        iframeMouseMove(e);
                    });

                    $(window).mousemove(function (e) {
                        windowMouseMove(e);
                    });

                    if (settings.afterElementSelect) {
                        settings.afterElementSelect(currenttable);
                    }
                },

                rebind: function (context) {
                    context.$ifrm.contents().find("table").each(function (i, v) {
                        $(v).unbind('click');
                        $(v).click(function (e) {
                            if (e.target == v || ($(e.target).is('td') && $(e.target).parents("table")[0] == v)) {
                                methods.tableClick(context, v);
                            }
                        });
                    });
                },

                refresh: function (context) {
                    methods.rebind(context);

                    methods.removeResizeElements();

                    if (!currenttable) {
                        if (settings.afterRefresh) {
                            settings.afterRefresh(null);
                        }
                        return;
                    }

                    var tbl = currenttable;

                    var tblHeight = $(tbl).outerHeight();
                    var tblWidth = $(tbl).outerWidth();
                    var iframePos = context.$ifrm.offset();
                    var tblPosition = $(tbl).offset();
                    var ifrmScrollTop = context.$ifrmBody.scrollTop();
                    var ifrmScrollLeft = context.$ifrmBody.scrollLeft();

                    context.$docBody.append("<span class='resize-selector' style='position:absolute;top:" + (iframePos.top + tblPosition.top - ifrmScrollTop + tblHeight) + "px;left:" + (iframePos.left + tblPosition.left - ifrmScrollLeft + tblWidth) + "px;border:solid 2px red;;width:6px;height:6px;cursor:se-resize;z-index:1;'></span>");

                    context.$docBody.append("<span class='resize-region' style='position:absolute;top:" + (iframePos.top + tblPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + tblPosition.left - ifrmScrollLeft) + "px;border:dashed 1px grey;;width:" + tblWidth + "px;height:0px;'></span>");
                    context.$docBody.append("<span class='resize-region' style='position:absolute;top:" + (iframePos.top + tblPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + tblPosition.left - ifrmScrollLeft) + "px;border:dashed 1px grey;;width:0px;height:" + tblHeight + "px;'></span>");

                    context.$docBody.append("<span class='resize-region' style='position:absolute;top:" + (iframePos.top + tblPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + tblPosition.left - ifrmScrollLeft + tblWidth) + "px;border:dashed 1px grey;;width:0px;height:" + tblHeight + "px;'></span>");
                    context.$docBody.append("<span class='resize-region' style='position:absolute;top:" + (iframePos.top + tblPosition.top - ifrmScrollTop + tblHeight) + "px;left:" + (iframePos.left + tblPosition.left - ifrmScrollLeft) + "px;border:dashed 1px grey;;width:" + tblWidth + "px;height:0px;'></span>");

                    lastCrc = methods.crc(context.$ifrmBody.html());

                    if (settings.afterRefresh) {
                        settings.afterRefresh(currenttable);
                    }
                },

                reset: function (context) {
                    currenttable = null;
                    tableResizeinProgress = false;
                    methods.removeResizeElements();
                    methods.rebind(context);

                    lastCrc = methods.crc(context.$ifrmBody.html());
                    if (settings.afterReset) {
                        settings.afterReset();
                    }
                },

                crc: function (str) {
                    var hash = 0;
                    if (str.length == 0) return hash;
                    for (i = 0; i < str.length; i++) {
                        char = str.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash;
                    }
                    return hash;
                }

            };

            var ifrm = this;
            var $ifrm = $(this);
            var $docBody = $("body");
            var $ifrmBody = $ifrm.contents().find("body");

            lastCrc = methods.crc($ifrmBody.html());

            if (!$ifrm.is('iframe')) {
                return;
            }

            var context = {
                ifrm: ifrm,
                $ifrm: $ifrm,
                $docBody: $docBody,
                $ifrmBody: $ifrmBody
            };

            ifrm.contentWindow.addEventListener('scroll', function () {
                methods.reset(context);
            }, false);

            $(ifrm.contentWindow.document).keyup(function () {
                if (!tableResizeinProgress) {
                    methods.reset(context);
                }
            }).mouseup(function (e) {
                if (lastCrc != methods.crc($ifrmBody.html())) {
                    methods.reset(context);
                }
                else {
                    var x = (e.x) ? e.x : e.clientX;
                    var y = (e.y) ? e.y : e.clientY;
                    var mouseUpElement = ifrm.contentWindow.document.elementFromPoint(x, y);
                    if (mouseUpElement) {
                        if (!$(mouseUpElement).is("table")) {
                            methods.reset(context);
                        }
                    }
                    else {
                        methods.reset(context);
                    }
                }
            });

            $(document).keyup(function (e) {
                if (e.keyCode == 27) {
                    methods.reset(context);
                }
            });

            setInterval(function () {
                if (!tableResizeinProgress && lastCrc != methods.crc($ifrmBody.html())) {
                    methods.reset(context);
                }
            }, 1000);

            $(document).bind('webkitresize-updatecrc', function (event, crc) {
                lastCrc = crc;
            });

            methods.refresh(context);

        });
    };


    $.fn.webkittdresize = function (options) {
        return this.each(function () {

            if (!$.browser.webkit) {
                return;
            }


            var settings = $.extend({
            }, options);

            var lastCrc;
            var tdResizeinProgress = false;
            var currenttd;

            var methods = {

                removeResizeElements: function (context) {
                    $(".td-resize-selector").remove();
                    $(".td-resize-region").remove();
                },

                tdClick: function (context, td) {
                    if (settings.beforeElementSelect) {
                        settings.beforeElementSelect(td);
                    }

                    methods.removeResizeElements();
                    currenttd = td;

                    var tdHeight = $(td).outerHeight();
                    var tdWidth = $(td).outerWidth();
                    var iframePos = context.$ifrm.offset();
                    var tdPosition = $(td).offset();
                    var ifrmScrollTop = context.$ifrmBody.scrollTop();
                    var ifrmScrollLeft = context.$ifrmBody.scrollLeft();

                    context.$docBody.append("<span class='td-resize-selector' style='margin:10px;position:absolute;top:" + (iframePos.top + tdPosition.top - ifrmScrollTop + tdHeight - 10) + "px;left:" + (iframePos.left + tdPosition.left - ifrmScrollLeft + tdWidth - 10) + "px;border:solid 2px red;width:6px;height:6px;cursor:se-resize;z-index:1;'></span>");

                    context.$docBody.append("<span class='td-resize-region td-region-top-right' style='position:absolute;top:" + (iframePos.top + tdPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + tdPosition.left - ifrmScrollLeft) + "px;border:dashed 1px green;width:" + tdWidth + "px;height:0px;'></span>");
                    context.$docBody.append("<span class='td-resize-region td-region-top-down' style='position:absolute;top:" + (iframePos.top + tdPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + tdPosition.left - ifrmScrollLeft) + "px;border:dashed 1px green;width:0px;height:" + tdHeight + "px;'></span>");

                    context.$docBody.append("<span class='td-resize-region td-region-right-down' style='position:absolute;top:" + (iframePos.top + tdPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + tdPosition.left - ifrmScrollLeft + tdWidth) + "px;border:dashed 1px green;width:0px;height:" + tdHeight + "px;'></span>");
                    context.$docBody.append("<span class='td-resize-region td-region-down-left' style='position:absolute;top:" + (iframePos.top + tdPosition.top - ifrmScrollTop + tdHeight) + "px;left:" + (iframePos.left + tdPosition.left - ifrmScrollLeft) + "px;border:dashed 1px green;width:" + tdWidth + "px;height:0px;'></span>");


                    var dragStop = function () {
                        if (tdResizeinProgress) {
                            $(currenttd)
                                .css("width", $(".td-region-top-right").width() + "px")
                                .css('height', $(".td-region-top-down").height() + "px");
                            methods.refresh(context);
                            $(currenttd).click();

                            $(document).trigger('webkitresize-updatecrc', [methods.crc(context.$ifrmBody.html())]);

                            tdResizeinProgress = false;

                            if (settings.afterResize) {
                                settings.afterResize(currenttd);
                            }
                        }
                    };

                    var iframeMouseMove = function (e) {
                        if (tdResizeinProgress) {

                            var resWidth = tdWidth;
                            var resHeight = tdHeight;

                            resHeight = e.pageY - tdPosition.top;
                            resWidth = e.pageX - tdPosition.left;

                            if (resHeight < 1) {
                                resHeight = 1;
                            }
                            if (resWidth < 1) {
                                resWidth = 1;
                            }

                            $(".td-resize-selector").css("top", (iframePos.top + tdPosition.top - ifrmScrollTop + resHeight - 10) + 'px').css("left", (iframePos.left + tdPosition.left - ifrmScrollLeft + resWidth - 10) + "px");
                            $(".td-region-top-right").css("width", resWidth + "px");
                            $(".td-region-top-down").css("height", resHeight + "px");

                            $(".td-region-right-down").css("left", (iframePos.left + tdPosition.left - ifrmScrollLeft + resWidth) + "px").css("height", resHeight + "px");
                            $(".td-region-down-left").css("top", (iframePos.top + tdPosition.top - ifrmScrollTop + resHeight) + "px").css("width", resWidth + "px");
                        }

                        return false;
                    };


                    var windowMouseMove = function (e) {
                        if (tdResizeinProgress) {

                            var resWidth = tdWidth;
                            var resHeight = tdHeight;

                            resHeight = e.pageY - (iframePos.top + tdPosition.top - ifrmScrollTop);
                            resWidth = e.pageX - (iframePos.left + tdPosition.left - ifrmScrollLeft);

                            if (resHeight < 1) {
                                resHeight = 1;
                            }
                            if (resWidth < 1) {
                                resWidth = 1;
                            }

                            $(".td-resize-selector").css("top", (iframePos.top + tdPosition.top - ifrmScrollTop + resHeight - 10) + 'px').css("left", (iframePos.left + tdPosition.left - ifrmScrollLeft + resWidth - 10) + "px");
                            $(".td-region-top-right").css("width", resWidth + "px");
                            $(".td-region-top-down").css("height", resHeight + "px");

                            $(".td-region-right-down").css("left", (iframePos.left + tdPosition.left - ifrmScrollLeft + resWidth) + "px").css("height", resHeight + "px");
                            $(".td-region-down-left").css("top", (iframePos.top + tdPosition.top - ifrmScrollTop + resHeight) + "px").css("width", resWidth + "px");
                        }

                        return false;
                    };

                    $(".td-resize-selector").mousedown(function (e) {
                        if (settings.beforeResizeStart) {
                            settings.beforeResizeStart(currenttd);
                        }
                        tdResizeinProgress = true;
                        return false;
                    });

                    $("*").mouseup(function () {
                        if (tdResizeinProgress) {
                            dragStop();
                        }
                    });

                    $(context.ifrm.contentWindow).mousemove(function (e) {
                        iframeMouseMove(e);
                    });

                    $(window).mousemove(function (e) {
                        windowMouseMove(e);
                    });

                    if (settings.afterElementSelect) {
                        settings.afterElementSelect(currenttd);
                    }
                },

                rebind: function (context) {
                    context.$ifrm.contents().find("td").each(function (i, v) {
                        $(v).unbind('click');
                        $(v).click(function (e) {
                            if (e.target == v) {
                                methods.tdClick(context, v);
                            }
                        });
                    });
                },

                refresh: function (context) {
                    methods.rebind(context);

                    methods.removeResizeElements();

                    if (!currenttd) {
                        if (settings.afterRefresh) {
                            settings.afterRefresh(null);
                        }
                        return;
                    }

                    var td = currenttd;

                    var tdHeight = $(td).outerHeight();
                    var tdWidth = $(td).outerWidth();
                    var iframePos = context.$ifrm.offset();
                    var tdPosition = $(td).offset();
                    var ifrmScrollTop = context.$ifrmBody.scrollTop();
                    var ifrmScrollLeft = context.$ifrmBody.scrollLeft();

                    context.$docBody.append("<span class='td-resize-selector' style='position:absolute;top:" + (iframePos.top + tdPosition.top - ifrmScrollTop + tdHeight) + "px;left:" + (iframePos.left + tdPosition.left - ifrmScrollLeft + tdWidth) + "px;border:solid 2px red;;width:6px;height:6px;cursor:se-resize;z-index:1;'></span>");

                    context.$docBody.append("<span class='td-resize-region' style='position:absolute;top:" + (iframePos.top + tdPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + tdPosition.left - ifrmScrollLeft) + "px;border:dashed 1px grey;;width:" + tdWidth + "px;height:0px;'></span>");
                    context.$docBody.append("<span class='td-resize-region' style='position:absolute;top:" + (iframePos.top + tdPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + tdPosition.left - ifrmScrollLeft) + "px;border:dashed 1px grey;;width:0px;height:" + tdHeight + "px;'></span>");

                    context.$docBody.append("<span class='td-resize-region' style='position:absolute;top:" + (iframePos.top + tdPosition.top - ifrmScrollTop) + "px;left:" + (iframePos.left + tdPosition.left - ifrmScrollLeft + tdWidth) + "px;border:dashed 1px grey;;width:0px;height:" + tdHeight + "px;'></span>");
                    context.$docBody.append("<span class='td-resize-region' style='position:absolute;top:" + (iframePos.top + tdPosition.top - ifrmScrollTop + tdHeight) + "px;left:" + (iframePos.left + tdPosition.left - ifrmScrollLeft) + "px;border:dashed 1px grey;;width:" + tdWidth + "px;height:0px;'></span>");

                    lastCrc = methods.crc(context.$ifrmBody.html());

                    if (settings.afterRefresh) {
                        settings.afterRefresh(currenttd);
                    }
                },

                reset: function (context) {
                    currenttd = null;
                    tdResizeinProgress = false;
                    methods.removeResizeElements();
                    methods.rebind(context);

                    lastCrc = methods.crc(context.$ifrmBody.html());
                    if (settings.afterReset) {
                        settings.afterReset();
                    }
                },

                crc: function (str) {
                    var hash = 0;
                    if (str.length == 0) return hash;
                    for (i = 0; i < str.length; i++) {
                        char = str.charCodeAt(i);
                        hash = ((hash << 5) - hash) + char;
                        hash = hash & hash;
                    }
                    return hash;
                }

            };

            var ifrm = this;
            var $ifrm = $(this);
            var $docBody = $("body");
            var $ifrmBody = $ifrm.contents().find("body");

            lastCrc = methods.crc($ifrmBody.html());

            if (!$ifrm.is('iframe')) {
                return;
            }

            var context = {
                ifrm: ifrm,
                $ifrm: $ifrm,
                $docBody: $docBody,
                $ifrmBody: $ifrmBody
            };

            ifrm.contentWindow.addEventListener('scroll', function () {
                methods.reset(context);
            }, false);

            $(ifrm.contentWindow.document).keyup(function () {
                if (!tdResizeinProgress) {
                    methods.reset(context);
                }
            }).mouseup(function (e) {
                if (lastCrc != methods.crc($ifrmBody.html())) {
                    methods.reset(context);
                }
                else {
                    var x = (e.x) ? e.x : e.clientX;
                    var y = (e.y) ? e.y : e.clientY;
                    var mouseUpElement = ifrm.contentWindow.document.elementFromPoint(x, y);
                    if (mouseUpElement) {
                        if (!$(mouseUpElement).is("td")) {
                            methods.reset(context);
                        }
                    }
                    else {
                        methods.reset(context);
                    }
                }
            });

            $(document).keyup(function (e) {
                if (e.keyCode == 27) {
                    methods.reset(context);
                }
            });

            setInterval(function () {
                if (!tdResizeinProgress && lastCrc != methods.crc($ifrmBody.html())) {
                    methods.reset(context);
                }
            }, 1000);

            methods.refresh(context);

        });
    };
})(jQuery);