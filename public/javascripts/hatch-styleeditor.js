(function () {
    'use strict';

    //style editor controller
    function StyleEditorController() {
        //public methods
        this.highlightMouseOverElement = highlightMouseOverElement;
        this.selectElement = selectElement;
        this.saveChanges = saveChanges;
        this.previewChanges = previewChanges;
        this.saveCss = saveCss;
        this.undoChanges = undoChanges;
        this.init = init;
        this.colorToHex = colorToHex;

        this.els = {
            body: $('body'),
            allTabs: $('#style-editor-form .tab-content .tab-pane'),
            selectedElement: $("#style-selected-element"),
            styleSelect: $("#style-select"),
            similarElements: $('#styleSimilarElements'),
            selectedLabel: $("#style-selected-label"),
            advancedProperties: $("#style-advanced-properties"),
            saveButtons: $("#style-save-buttons"),
            allEditorTabs: $("#styleEditorTabs ul li"),
            themeSelect: $("#theme-select"),
            undoButtons: $("#style-undo-button"),
            editorChangesPending: $("#css-editor-changes-pending"),
            editorFrame: $(".css-editor-frame"),
            themeChangesPending: $("#theme-changes-pending"),
            themeFrame: $("#theme-frame"),
            textareaVariables: $("#style-css-textarea-variables"),
            textareaBootswatch: $("#style-css-textarea-bootswatch"),
            textareaCustom: $("#style-css-textarea-custom"),
            saveButton: $("#style-save-button"),
            saveCssButton: $("#style-save-css-button"),
            previewCssButton: $("#style-preview-css-button"),
            undoCssButton: $("#style-undo-css-button"),
            themeSaveButton: $("#theme-save-button"),
            designTab: $("#designTab"),
            ruleList: $("#css-rule-list"),
            themePreview: $("#theme-preview"),
            themeSaveButtons: $("#theme-save-buttons"),
            bgUploadButton: $('#style-background-image_upload'),
            bgNoneButton: $('#style-background-image_none'),
            styleCss: $('#style-css')
        };

        if (this.els.styleCss.length === 0) {
            this.els.styleCss = $('<style id="style-css"></style>');
            $('head').append(this.els.styleCss);
        }

        //public members
        this.currentEl = null;
        this.currentSelector = null;
        this.changesPending = false;
        this.changes = {};
        this.on = true;
        
        //constants
        var allowedTags = [ "h1", "h2", "h3", "h4", "h5", "h6", "body", "p" ];
        var nesw = ["top", "right", "bottom", "left"];
        var tlbr = ["top-left", "top-right", "bottom-right", "bottom-left"];
        var fonts = ["Helvetica, Arial, Sans-Serif", "Arial, Helvetica, Sans-Serif", "Times New Roman, Times, Serif", "Verdana, Sans-Serif", "Georgia, Times, Serif", "Tahoma, Sans-Serif", "Comic Sans MS, Sans-Serif", "Trebuchet MS, Sans-Serif", "Arial Black, Sans-Serif", "Impact, Sans-Serif", "Courier New, Courier", "Palatino, Serif", "Garamond, Serif", "Bookman, Serif"];
        var disallowedSelectors = ["span", "ui-", "hover", ".outline", ".outlineActive", ".edit-console", "-moz", "-webkit", "icon", "after", "before", "clearfix"];

        //this reference for event handlers
        var c = this;

        //advanced or not - remember with a cookie
        $('#styleAdvancedToggle').bind('click', function() {
            var advanced = !$(this).hasClass('btn-success');
            $.cookie('styleEditorAdvanced', advanced ? true : null, '/');

            if(advanced) {
                $('#style-properties').addClass('advanced');
                $('#styleAdvancedToggle').addClass('btn-success');
            }
            else {
                $('#style-properties').removeClass('advanced');
                $('#styleAdvancedToggle').removeClass('btn-success');
            }

            return false;
        });

        if($.cookie('styleEditorAdvanced')) {
            $('#styleAdvancedToggle').addClass('btn-success');
            $('#style-properties').addClass('advanced');
        }

        //test for disallowed selectors
        function shouldIgnore(selector)
        {
            if(!selector) return true;
            for(var j in disallowedSelectors) if(selector.indexOf(disallowedSelectors[j]) > -1) return true;
            return false;
        }

        //describes the selected element
        function describe(el, all) {
            var appliedRules = [];
            var ignored = false;

            for (var x = 0; x < document.styleSheets.length; x++) {
                var rules;

                try {
                    rules = document.styleSheets[x].cssRules;
                } catch (err) {
                    // do nothing - probably a security error
                }

                if (rules) {
                    for (var i = 0; i < rules.length; i++) {
                        try {
                            if ($(el).is(rules[i].selectorText)) {
                                var rule = rules[i].selectorText;
                                if(shouldIgnore(rule)) {
                                    ignored = true;
                                }

                                if(appliedRules.indexOf(rule) === -1) {
                                    appliedRules.push(rule);
                                }
                            }
                        } catch(exception) {
                            continue;
                        }
                    }
                }
            }

            //if we are not showing all selectors, find the most specific
            if(!all) {
                var score = -999;
                var match = null;
                appliedRules.forEach(function(rule) { 
                    var s = rule.split(' ').length / rule.split(',').length;
                    if(s >= score) { 
                        score = s;
                        match = rule;
                    }
                });

                return match;
            }

            if(appliedRules.length === 0 && ignored && !all) return false;
            return appliedRules;
        }    
        
        //converts rgb to hex colors
        function colorToHex(color) {
            //blank,transparent,hex,rgba: return original value
            if(color == "rgba(0, 0, 0, 0)") return "";
            if(color == "" || color == "transparent" || color.substr(0, 1) === '#' || color.indexOf("rgba") === 0) return color;

            try {
                var digits = /(.*?)rgb\((\d+), (\d+), (\d+)\)/.exec(color);

                var red = parseInt(digits[2]);
                var green = parseInt(digits[3]);
                var blue = parseInt(digits[4]);

                var rgb = blue | (green << 8) | (red << 16);
                return digits[1] + '#' + rgb.toString(16);
            } catch(exception) {
                return color;
            }
        }
        
        //starts the css selector element highlighter
        function highlightMouseOverElement(explicit) {
            if(c.highlightMode) return;
            c.highlightMode = true;

            var last = new Date();
            var currentEl = null;

            if(explicit) {
                c.els.allTabs.removeClass('active');
                c.els.styleSelect.addClass('active');
            }

            //click event - shows the selector style edit tools and unbinds
            function click(e) {
                if($(e.target).parents(".edit-console").length === 0) {
                    c.stopHighlight();

                    //select the current element
                    c.selectElement(currentEl);

                    if($(e.target).is('a')) {
                        $(e.target).attr('href', $(e.target).data('href'));
                        $(e.target).data('href', null);
                    }

                    setTimeout(function() {
                        if($('#styleSelectElement').hasClass('btn-success')) {
                            c.highlightMouseOverElement();
                        }
                    }, 4000);

                    e.preventDefault();
                    e.stopPropagation();

                    return false;
                }
            }

            //first stop highlighting just in case
            if(c.stopHighlight) c.stopHighlight();

            //re-start highlighting the current selector
            if(c.currentSelector) $(c.currentSelector).addClass('outlineActive');

            //function to stop highlighting
            c.stopHighlight = function() {
                //unbind
                c.els.body.unbind("click", click);
                c.els.body.unbind("mousemove", mousemove);

                $(".outline").removeClass("outline");

                c.highlightMode = false;
            };

            function checkStopHighlight() {
                if((!$('#style-properties').is(':visible') && !$('#style-select').is(':visible')) || $('#collapseThree').height() === 0) {
                    $('.outlineActive').removeClass('outlineActive');
                    c.stopHighlight();
                    c.els.selectedLabel.hide();

                    checkResumeHighlight();
                }
                else {
                    setTimeout(checkStopHighlight, 1000);
                }
            }

            //check to see if we should stop highlighting
            setTimeout(checkStopHighlight, 1000);

            function checkResumeHighlight() {
                if(($('#style-properties').is(':visible') || $('#style-select').is(':visible')) && $('#collapseThree').height() > 0) {
                    c.highlightMouseOverElement();
                }
                else {
                    setTimeout(checkResumeHighlight, 1000);
                }
            }

            //mousemove event to show active selector
            function mousemove(e) {
                var el = e.target;
                var now = new Date();
                
                //don't run this even so often
                if (now-last < 100) return;
                last = now;

                if($(el).parents('.edit-console').length > 0) {
                    $('.outline').removeClass('outline');
                    c.els.selectedElement.text(c.currentSelectorName || 'select an element');
                    return;
                }
                else if(el != currentEl) {
                    var selectorName = describe(el);
                    var i = 0;

                    while(selectorName == null && selectorName !== false && i < 3) {
                        el = el.parentNode;
                        selectorName = describe(el);
                        i++;

                        if(selectorName === false) return;
                    }

                    if(selectorName && el != currentEl) {
                        if(shouldIgnore(selectorName)) return false;

                        $(el).addClass("outline");
                        $(currentEl).removeClass("outline");

                        if($(el).is('a')) {
                            $(el).data('href', $(el).attr('href'));
                            $(el).attr('href', '#');
                        }

                        if($(currentEl).is('a')) {
                            $(currentEl).attr('href', $(currentEl).data('href'));
                            $(currentEl).data('href', null);
                        }

                        currentEl = el;

                        c.els.selectedElement.text(selectorName);
                    }
                }
            }
            
            //instructions
            c.els.selectedLabel.show();
            
            //bind events
            c.els.body.bind("mousemove", mousemove);
            setTimeout(function() { c.els.body.bind("click", click); }, 10);
        }

        //event which is triggered when an element is selected
        function selectElement(el, selector) {
            if(!el) return;
            
            //disable the style editor whilst we set the style properties
            this.on = false;
            this.currentEl = el;
            var advanced = true; //$.cookie('styleEditorAdvanced') ? true : false;

            //get the selector by looking at the currently selected element
            if(typeof selector == "undefined") selector = describe(el, false);
            else advanced = true;
            
            this.currentSelector = selector;
            this.currentSelectorName = describe(selector);

            //are there any similar elements
            var allSelectors = describe(el, true);
            if(allSelectors.length > 1) {
                this.els.similarElements.show();

                var $menu = this.els.similarElements.parents('ul:first');
                $menu.find('.similar').remove();

                allSelectors.forEach(function(sel) {
                    if(sel != selector) {
                        var $li = $('<li class="similar"><a href="#">' + sel + '</a></li>');
                        var $a = $li.find('a');

                        $menu.append($li);

                        $a.on('click', function() {
                            c.selectElement(el, sel);

                            c.els.styleSelect.removeClass('active');
                            $('#styleEditorTabs').find('.dropdown').removeClass('open');
                            return false;
                        });
                    }
                })
            }
            else {
                this.els.similarElements.hide();
            }

            //show which element we are editing
            c.els.selectedElement.text(selector);

            //show the visual notification on the page for all elements that are being edited
            $(el).removeClass("outline");
            $('.outlineActive').removeClass('outlineActive');

            //blink if we have a style tab selected
            if(($("#styleEditorTabs li.active > a:not(.dropdown-toggle)").attr("href") || "").indexOf("#style-") == 0) $('*:not(.edit-console) ' + selector).blink("outline");
            setTimeout(function() {
                $(selector).addClass('outlineActive');
                $('.edit-console ' + selector).removeClass('outlineActive');
            }, 2000);
            
            //select the style-font tab if we are currently on the element select tab - only fires correctly in webkit via setTimeout
            setTimeout(function() { 
                if(c.els.styleSelect.hasClass("active")) {
                    //show all the tabs
                    c.els.allEditorTabs.removeClass("hidden");
                    
                    //select the font/advanced tab
                    $("#properties-tab").click();
                }
            }, 10);
            
            //var cssRules = getCssRules($(el));
            var cssRules = getCssRules(selector);
        
            //populate the standard style selectors
            $("#style-font-family").valadd($(el).css("font-family"));
            $("#style-font-size").val($(el).css("font-size").replace("px", ""));
            $("#style-font-size-label").text($(el).css("font-size"));
            $("#style-color").val(colorToHex($(el).css("color")));
            $("#cp-style-color").css('background-color', $(el).css('color'));
            $("#style-text-style a").removeClass("active");
            if($(el).css("font-weight") == "bold") $("#style-font-weight_bold").button('toggle');
            if($(el).css("font-style") == "italic") $("#style-font-style_italic").button('toggle');
            if($(el).css("text-decoration") == "underline") $("#style-text-decoration_underline").button('toggle');
            $("#style-background-color").val(colorToHex($(el).css("background-color")));
            $("#cp-style-background-color").css("background-color", $(el).css("background-color"));
            $("#style-background-repeat").val($(el).css("background-repeat"));
            $("#style-background-position").val($(el).css("background-position"));
            $("#style-border-style").val($(el).css("border-style"));
            $("#style-border-color").val(colorToHex($(el).css("border-color")));
            $("#cp-style-border-color").css("background-color", $(el).css("border-color"));
            
            //border, margin, padding values
            $.each(["border-$1-width", "margin-$1", "padding-$1"], function(i, type) {
                $.each(nesw, function(j, direction) {
                    $("#style-" + type.replace("$1", direction)).val(parseInt($(el).css(type.replace("$1", direction))));
                });
            });
            
            //populate the advanced style selectors
            c.els.advancedProperties.empty();
            $.each(cssRules, function(key, value) {
                //ignore blank rules when building the advanced properties list
                if(value == "" || value == "initial" || key == "1") return;
                addAdvancedProperty(key, value);
            });

            //re-enable the style editor
            this.on = true;
        }

        //save changes via AJAX call to the style controller
        function saveChanges() {
            $.ajax(window.hatch.pathTo('admin/stylesheet/setrules'), {
                data: { rules : c.changes },
                type: "POST",
                complete: function() {
                    c.changes = {};

                    //hide the save buttons
                    c.changesPending = false;
                    c.els.saveButtons.addClass("hidden");

                    //display notification
                    $.noty({text: "<i class='icon-ok'></i> Stylesheet saved", type: "success"});

                    //reload CSS
                    loadCssIntoTextarea();
                }
            });
        }

        //applies the selected theme
        function applySelectedTheme() {
            var theme = c.els.themeSelect.val();

            $.blockUI({ css: { 
                border: 'none', 
                padding: '15px', 
                backgroundColor: '#000', 
                '-webkit-border-radius': '10px', 
                '-moz-border-radius': '10px', 
                opacity: .5, 
                color: '#fff' 
            } }); 
             
            $.ajax(window.hatch.pathTo('admin/stylesheet/theme?name=' + theme), {
                type: 'POST',
                success: function(res) {
                    $.unblockUI();

                    // clear the preview css
                    c.els.styleCss.text('');

                    if (res.url) {
                        // reload the stylesheet
                        setStylesheetHref(res.url);
                        c.els.themeSaveButtons.addClass("hidden");

                        setTimeout(function() {
                            $.noty({text: "<i class='icon-ok'></i> Theme changed to " + theme, type: "success"});
                        }, 500);
                    } else {
                        $.noty({text: "<i class='icon-info-sign'></i> Error changing theme", type: "error"});
                    }
                }
            });
        }

        //TODO: REFACTOR
        //preview changes via the CSS textarea
        function previewChanges() {
            var cssText = $("#style-css-textarea").val();
            $("#preview-stylesheet").text(cssText);
            $("#main-stylesheet").attr("disabled", 'disabled');
        }

        //TODO: REFACTOR
        //saves CSS changes from the text area
        function saveCss() {
            var cssText = $("#style-css-textarea").val();
            $.ajax(window.hatch.pathTo('admin/stylesheet/setless'), {
                data: {
                    less: {
                        custom: c.els.textareaCustom.val(),
                        variables: c.els.textareaVariables.val(),
                        bootswatch: c.els.textareaBootswatch.val()
                    }
                },
                type: "POST",
                complete: function() {
                    c.changes = {};

                    //hide the save buttons
                    c.changesPending = false;
                    c.els.saveButtons.addClass("hidden");

                    //display notification
                    $.noty({text: "<i class='icon-ok'></i> Stylesheet saved", type: "success"});

                    //reload the stylesheet
                    var href = $("#main-stylesheet").attr("href");
                    setStylesheetHref(href);
                }
            });
        }
        
        //undo changes by reloading the stylesheet
        function undoChanges() {
            var href = $("#main-stylesheet").attr("href");
            setStylesheetHref(href);
            c.els.styleCss.text('');

            //display notification
            $.noty({text: "<i class='icon-info-sign'></i> Changes have been reverted", type: "alert"});
        }

        //explicitly (re)sets the main stylesheet link href
        function setStylesheetHref(href) {
            //break cache
            if(href.indexOf("nocache=") > -1) href = href.substring(0, href.indexOf("nocache=") -1);
            href += (href.indexOf("?") == -1 ? "?":"&") + "nocache=" + Math.floor((Math.random()*100000000)+1);

            var stylesheetLength = document.styleSheets.length;
            var link = $("#main-stylesheet");
            var newLink = $("<link id='main-stylesheet' href='" + href + "' rel='stylesheet' type='text/stylesheet' />");
            $("head").append(newLink);

            //show the loading stripes on the undo button
            c.els.undoButtons.addClass("loading");

            //function to check that the stylesheet has been loaded so that we can switch off the old stylesheet <link>
            function checkLoaded() {
                if(document.styleSheets.length == stylesheetLength) {
                    setTimeout(checkLoaded, 5);
                    return;    
                }

                //wait 250ms more for everything to load properly and then make all changes
                setTimeout(function() {
                    //kill the original stylesheet
                    link.remove();

                    //remove loading stripes
                    c.els.undoButtons.removeClass("loading");

                    //hide the save buttons
                    c.changesPending = false;
                    c.els.saveButtons.addClass("hidden");

                    //setup the base font inputs
                    setBaseFontInputs();

                    //reload the current selector
                    c.selectElement(c.currentEl, c.currentSelector);

                    //allow the css text-editor
                    c.els.editorChangesPending.addClass("hidden");
                    c.els.editorFrame.removeClass("hidden");

                    //allow the theme selector
                    c.els.themeChangesPending.addClass("hidden");
                    c.els.themeFrame.removeClass("hidden");

                    //set the changes to 0
                    this.changes = {};
                }, 50);
            }

            checkLoaded();
        }

        //gets all of the css rules for the specified selector
        function getCssRules(a) {
            var sheets = document.styleSheets, o = {};
            for(var i in sheets) {
                if(sheets[i].href == null) continue;
                var rules;

                try {
                    rules = sheets[i].rules || sheets[i].cssRules;
                } catch (err) {
                    // do nothing - probably a security error
                }

                if (rules) {
                    for(var r in rules) {
                        var rule = rules[r].selectorText;
                        if(shouldIgnore(rule)) continue;

                        if(typeof a == 'string') {
                            if(a == rules[r].selectorText) {
                                o = $.extend(o, css2json(rules[r].style));
                            }
                        }
                        else {
                            if(a.is(rules[r].selectorText)) {
                                o = $.extend(o, css2json(rules[r].style), css2json(a.attr('style')));
                            }
                        }
                    }
                }
            }
            
            //combine NESW rules for margin, border, border-radius, padding
            var rules = ["margin-$1", "border-$1-radius", "border-$1-width", "border-$1-style", "border-$1-color", "padding-$1"];
            
            for(var i in rules) {
                var rule = rules[i];
                var baseRule = rule.replace("-$1", "");
                var hasBaseRule = o[rule.replace("$1", (rule.indexOf("-radius") > -1) ? tlbr[0] : nesw[0])];
                
                if(hasBaseRule) {
                    var val = "";
                    var prev = "";
                    var same = true;
                    
                    for(var d in ((rule.indexOf("-radius") > -1) ? tlbr : nesw)) {
                        var direction = ((rule.indexOf("-radius") > -1) ? tlbr : nesw)[d];
                        var v = o[rule.replace("$1", direction)];
                        
                        if(v != prev && d > 0) same = false;
                        prev = v;
                        
                        if(v) {
                            val += v + " ";
                            o[rule.replace("$1", direction)] = "";
                        }
                        else val += "inherit ";
                    }
                    
                    if(same) val = prev;
                    else val = val.substring(0, val.length -1);
                    
                    o[rule.replace("-$1", "")] = val;
                }
            }
            
            return o;
        }

        //converts css rules to json
        function css2json(css){
            var s = {};
            if(!css) return s;
            if(css instanceof CSSStyleDeclaration) {
                for(var i in css) {
                    if((css[i]).toLowerCase) {
                        s[(css[i]).toLowerCase()] = (css[css[i]]);
                    }
                }
            } else if(typeof css == "string") {
                css = css.split("; ");          
                for (var i in css) {
                    var l = css[i].split(": ");
                    s[l[0].toLowerCase()] = (l[1]);
                };
            }
            
            return s;
        }

        //loads the css into the textarea
        function loadCssIntoTextarea() {
            $.ajax(window.hatch.pathTo('admin/stylesheet/load')).done(function(data) {
                if (data && data.stylesheet && data.stylesheet.less) {
                    c.els.textareaVariables.val(data.stylesheet.less.variables);
                    c.els.textareaBootswatch.val(data.stylesheet.less.bootswatch);
                    c.els.textareaCustom.val(data.stylesheet.less.custom);
                }
            });

            //prevent tab from being pressed - don't insert the tab because this causes the browser to hang
            $("#style-css-textarea").keydown(function(e) {
                if(e.keyCode === 9) {
                    return false;
                }
            });
        }
        
        //initialises the style editor, attached events
        function init() {
            //get the colorscheme
            var palette = Object.keys(colorScheme.colors);

            //remove background image
            c.els.bgNoneButton.bind('click', function() {
                setCssRule(c.currentSelector, 'background-image', 'none');
            });

            //bind save and undo buttons
            c.els.saveButton.bind("click", this.saveChanges);
            c.els.undoButtons.bind("click", this.undoChanges);
            c.els.saveCssButton.bind("click", this.saveCss)
            c.els.previewCssButton.bind("click", this.previewChanges);
            c.els.undoCssButton.bind("click", loadCssIntoTextarea);
            c.els.themeSaveButton.bind("click", applySelectedTheme);

            //load textarea css
            loadCssIntoTextarea();

            //setup fonts lists
            $(".font-list").each(function(i, el) {
                $(fonts).each(function(i, font) {
                    $(el).append('<option value="' + font + '">' + font + '</option>');
                });

                //add the 'add web-font option'
                $(el).append("<option value='-'>--------</option>");
                $(el).append("<option value='_WEBFONTS'>Select web-font</option>");

                $(el).bind("change", function() {
                    if($(el).val() == "-") $(el).val("");
                    if($(el).val() == "_WEBFONTS") {
                        $("#webfonts-iframe").attr("src", "about:blank");
                        $("#webfonts-modal").modal();

                        setTimeout(function(){
                            $("#webfonts-iframe").attr("src", "/html/webfonts-selector.html");
                        }, 500);

                        //attach the event to the use button
                        $("#useWebFont").unbind().bind("click", function() {
                            //get the selected font
                            var font = window.frames["webfonts-iframe"].$("#web-fonts").val();

                            if(!font) {
                                alert("Please select a font");
                                return;
                            }

                            var url = "http://fonts.googleapis.com/css?family=" + font.replace(/\s+/g, '+');
                            var letters = "";

                            //append the change to the stylesheet
                            setCssRule("@", "import", "url(" + url + ")");

                            //load the font
                            $('<link rel="stylesheet" href="' + url +'"  type="text/css" />').prependTo('head');

                            //set the font
                            $('<option value="' + font + '">' + font + '</option>').appendTo($(".font-list"));
                            $(el).val(font);
                            $(el).trigger("change");

                            //close the webfonts modal
                            $("#webfonts-modal").modal('hide');
                        });

                        $(el).val("");
                        return false;
                    }
                })
            });
                
            function styleclick() {
                c.highlightMouseOverElement();
                
                setTimeout(function() {
                    c.els.ruleList.chosen();    
                }, 100);
            }

            var allRules = [];
            for (var x = 0; x < document.styleSheets.length; x++) {

                var rules;
                try {
                   rules = document.styleSheets[x].cssRules;
                } catch (err) {
                    // do nothing - probably a security error
                }

                if (!rules) continue;
                for (var i = 0; i < rules.length; i++) {
                    var rule = $.trim(rules[i].selectorText);

                    var ignore = false;
                    for(var j in disallowedSelectors) if(rule == null || rule.indexOf(disallowedSelectors[j]) > -1) ignore = true;
                    //if(ignore) continue;

                    try {
                        if($(rule).length == 0) continue;
                    } catch (exception) {
                        continue;
                    }

                    if($.inArray(rule, allRules) == -1) allRules.push(rule);
                }
            }

            $(allRules).each(function(i, rule) {
                c.els.ruleList.append("<option value=\"" + rule + "\">" + rule + "</option>");
            });

            c.els.ruleList.bind("change", function() {
                c.selectElement($(c.els.ruleList.val()), c.els.ruleList.val());
            });

            $("#contentTab, #columnsTab, #designTab").click(function() {
                var el = $($(this).attr("href"));

                $(".accordion-body.open").removeClass("open");
                setTimeout(function() { $(el).addClass("open"); }, 500);
            });
            
            $("#styleSelectTab").click(styleclick);
            $("#styleUpElement").click(function() {
                c.selectElement($(c.currentEl).parent());
                return false;
            });

            $('#styleSelectElement').bind('click', function() {

                if($(this).hasClass('btn-success')) {
                    $(this).removeClass('btn-success');
                    c.stopHighlight();
                }
                else {
                    c.highlightMouseOverElement();
                    $(this).addClass('btn-success');    
                }
                
                return false;
            });
            
            //toggle the class label
            $('#styleEditorTabs a[data-toggle="tab"]').on('show', function (e) {
                if(e.target.hash.indexOf("#style-") == 0) c.els.selectedLabel.show();
                else c.els.selectedLabel.hide();

                if(e.target.hash.indexOf("#css-") == 0) {
                    $('#css-save-buttons').removeClass('hidden');

                    if(c.changesPending) {
                        c.els.editorChangesPending.removeClass("hidden");
                        c.els.editorFrame.addClass("hidden");
                        $('#css-save-buttons').addClass('hidden');
                    }
                }
                else $('#css-save-buttons').addClass('hidden');

                if(e.target.hash == "#themes") {
                    if(c.changesPending) {
                        c.els.themeChangesPending.removeClass("hidden");
                        c.els.themeFrame.addClass("hidden");
                    }
                }
            });
            
            //basic style editing
            $("input, select").each(function(i, el) {
                if(el.id && el.id.indexOf("style-") == 0) {
                    $(el).bind("change", function() {
                        var property = el.id.replace("style-", "");
                        var units = "";
                        
                        var unitsProperties = ["size", "width", "height", "margin", "padding"];
                        $(unitsProperties).each(function(i, p) {
                            if(property.indexOf(p) > -1) units = "px"; 
                        });
                        
                        setCssRule(c.currentSelector, property, $(el).val() + units);
                    });
                }
            });
            
            //basic style editing buttons
            $("#style-editor-form .btn").each(function(i, el) {
                $(el).attr("href", "javascript:void(0);")
            });
            $("#style-editor-form .btn").bind("click", function() {
                var property = this.id.replace("style-", "");
                var value = property.substring(property.indexOf("_") +1);
                property = property.substring(0, property.indexOf("_"));
                var on = $(this).hasClass("active");

                if(on && property == "text-decoration") value = "none";
                else if(on) value = "normal";

                setCssRule(c.currentSelector, property, value);

                //return false;
            });
            
            //setup the input range labels
            $("#style-font-size").bind("change", function() { $("#style-font-size-label").text($("#style-font-size").val() + "px"); });
            
            //TODO: adjust the line-height accordingly
            
            //spacing drag handles
            $("#spacingBorderStyles .inputDragHandle").each(function(i, el) {
                var property = $(el).prev().attr("id").replace("style-", "");
                $(el).draggable({ 
                    axis: "x",
                    revert: true,
                    drag: function(e, ui) {
                        var delta = ui.position.left;
                        
                        //only margins can be negative
                        if(property.indexOf("margin") == -1) delta = Math.max(0, delta);
                        
                        $(el).prev().val(delta); 
                        setCssRule(c.currentSelector, property, delta + "px");
                    }
                });
            });
            
            //fonts-tab
            //setup the range input events so that the labels work
            $("#body-font-size").bind("change", function() { $("#body-font-size-label").text($("#body-font-size").val() + "px"); });
            $("#title-font-size").bind("change", function() { $("#title-font-size-label").text($("#title-font-size").val() + "px"); });
            $("#header-font-size").bind("change", function() { $("#header-font-size-label").text($("#header-font-size").val() + "px"); });

            //setup the values for the fonts tab
            setBaseFontInputs();

            //setup the font size/family event handlers
            $("#body-font-size").bind("change", function() {
                setCssRule("body", "font-size", $("#body-font-size").val() + "px");
                setCssRule("body", "line-height", ($("#body-font-size").val() * 18/13) + "px");
            });
            $("#body-font-family").bind("change", function() { setCssRule("body", "font-family", $("#body-font-family").val()); });
            $("#title-font-size").bind("change", function() {
                setCssRule("h2", "font-size", $("#title-font-size").val() + "px");
                setCssRule("h2", "line-height", ($("#title-font-size").val() * 18/13) + "px");
            });
            $("#title-font-family").bind("change", function() { setCssRule("h2", "font-family", $("#title-font-family").val()); });
            $("#header-font-size").bind("change", function() {
                setCssRule("h1", "font-size", $("#header-font-size").val() + "px");
                setCssRule("h1", "line-height", ($("#header-font-size").val() * 18/13) + "px");
            });
            $("#header-font-family").bind("change", function() { setCssRule("h1", "font-family", $("#header-font-family").val()); });
            
            //setup the autocomplete CSS rule selector
            $.each(CSSPROPERTIES, function(i, val) {
                $("#advanced-styles .chzn-select").append("<option value='" + val + "'>" + val + "</option>"); 
            });
            $("#advanced-styles .chzn-select").chosen();
            
            //adding new style rules with the advanced editor
            $("#advanced-styles .chzn-select").bind("change", function() {
                var property = $("#advanced-styles .chzn-select")[0].value;
                addAdvancedProperty(property, "");
                
                $("#advanced-styles .chzn-container").remove();
                $("#advanced-styles .chzn-select")[0].value = "";
                $("#advanced-styles .chzn-select").removeClass("chzn-done").chosen();
                
                //focus on the new element
                $("#adv-" + property).focus();
            });

            //theme selection
            c.els.themeSelect.bind("change", function() {
                var theme = c.els.themeSelect.val();
                c.els.themePreview.show().attr("src", $(c.els.themeSelect[0].options[c.els.themeSelect[0].selectedIndex]).attr('data-thumbnail'));
                c.els.themeSaveButtons.removeClass("hidden");
            });
        }

        //sets up the fonts tab with values from the current stylesheet
        function setBaseFontInputs() {
            $("#body-font-size").val($("body").css("font-size").replace("px", ""));
            $("#body-font-size-label").text($("body").css("font-size"));
            $("#body-font-family").valadd($("body").css("font-family"));
            if($("h2").length > 0) {
                $("#title-font-size").val($("h2").css("font-size").replace("px", ""));
                $("#title-font-size-label").text($("h2").css("font-size"));
                $("#title-font-family").valadd($("h2").css("font-family"));
            }
            if($("h1").length > 0) {
                $("#header-font-size").val($("h1").css("font-size").replace("px", ""));
                $("#header-font-size-label").text($("h1").css("font-size"));
                $("#header-font-family").valadd($("h1").css("font-family"));
            }
        }
        
        //adds an advanced property to the list
        function addAdvancedProperty(property, value) {
            var existing = $("#adv-" + property);
            if(existing.length > 0) {
                existing.focus();
                return;
            }

            //properties with a value of inherit do not need to be displayed
            if(value == 'inherit') {
                return;
            }
            
            //convert colours to hex
            if(property.indexOf("color") > -1) value = colorToHex(value);
            
            var width = 230 - 21 - (6 * property.length) - 16;
            var el = $('<div class="control-group advanced-style"><input type="checkbox" id="adv-check-' + property + '" checked="checked" tabindex="999" /><label class="control-label" for="adv-' + property + '">' + property + ':</label><div class="controls"><input type="text" autocomplete="off" spellcheck="off" value="' + value + '" id="adv-' + property + '" style="width : ' + width + 'px;"/></div></div>');   
            c.els.advancedProperties.append(el);
            
            var input = $("#adv-" + property);
            var checkbox = $("#adv-check-" + property);

            //keydown function allows user to press up/down arrow keys to change numerical values for a property
            input.bind("keydown", function(e) {
                var delta = 0;
                if(e.keyCode == 38) delta = 1;
                else if(e.keyCode == 40) delta = -1;
                
                if(delta != 0) {
                    var str = input[0].value;
                    var cursor = input[0].selectionStart;
                    var originalCursor = cursor;
                    
                    //get the value under the cursor
                    cursor = Math.max(cursor -2, 0);
                    var cursorEnd = Math.min(cursor + 4, str.length);
                    var value = parseFloat(str.substring(cursor, cursorEnd));
                    
                    //increment/decrement the value
                    var newValue = value + delta;
                    
                    //replace the value in the text field
                    var newStr = str.substring(0, cursor) + str.substring(cursor, cursorEnd).replace(value, newValue) + str.substring(cursorEnd);
                    var changed = newStr != input[0].value;

                    input[0].value = newStr;

                    setTimeout(function() {
                        input[0].selectionStart = originalCursor;
                        input[0].selectionEnd = originalCursor;
                    }, 0);
                    
                    e.preventDefault();
                    
                    if(changed) triggerClassChange();
                    return;   
                }
            });
            
            //bind keyup event to trigger a change of value
            input.bind("keypress", function(e) {
                if(e.charCode == 13) {
                    input.blur();
                    return false;
                }
            });
            
            //bind blur event to disable the property if the new property value is still blank
            input.bind("blur", function(e) {
                if(input[0].value == "") {
                    checkbox[0].checked = false;
                    el.addClass("disabled");
                }
            });
            
            //bind change event so that styles are changed and/or re-enabled when value is changed
            input.bind("change", function(e) {
                if(input[0].value != "" && !checkbox[0].checked) {
                    checkbox[0].checked = true;
                    el.removeClass("disabled");
                }
                
                triggerClassChange();
            });
            
            //disable the field when checkbox is clicked
            checkbox.bind("click", function() {
                if(checkbox[0].checked) el.removeClass("disabled");
                else el.addClass("disabled");
                
                triggerClassChange();
            });
            
            //tells the style controller to make a change to the stylesheet on the page
            function triggerClassChange() {
                var value = input[0].value;
                if(!checkbox[0].checked) value = "inherit";
                setCssRule(c.currentSelector, property, value);
            }
        }
        
        
        //tells the style controller to make a change to the stylesheet on the page
        function setCssRule(selector, property, value) {
            if(!selector || !property || !c.on) return;

            if(!c.changes[selector]) c.changes[selector] = {};
            c.changes[selector][property] = value;

            //ignore font imports
            if(selector != "@") {
                //check for the same value
                if($(selector).css(property) == value) {
                    return;
                }

                // get the exact match for the rule only
                var rule = $.rule(new RegExp('^' + selector + '$'));
                rule.append(property + ":" + value);

                // add the rule manually to the style preview css
                c.els.styleCss.text(c.els.styleCss.text() + '\n' + selector + '{ ' + property + ':' + value + ' ! important; }');
            }
            
            //set the changes pending flag
            c.changesPending = true;
            
            //show the save/undo buttons
            c.els.saveButtons.removeClass("hidden");
        }
    }

    // EXPORTS
    window.StyleEditorController = StyleEditorController;
})();