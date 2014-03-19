//
// Hatch.js is a CMS and social website building framework built in Node.js 
// Copyright (C) 2013 Inventures Software Ltd
// 
// This file is part of Hatch.js
// 
// Hatch.js is free software: you can redistribute it and/or modify it under the terms of the
// GNU Affero General Public License as published by the Free Software Foundation, version 3
// 
// Hatch.js is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// 
// See the GNU Affero General Public License for more details. You should have received a copy of the GNU
// General Public License along with Hatch.js. If not, see <http://www.gnu.org/licenses/>.
// 
// Authors: Marcus Greenwood, Anatoliy Chakkaev and others
//

var zlib = require('zlib');
var express = require('express');
var fontStatic = express.static(__dirname + '/../../../../bower_components/font-awesome', { maxAge: 31557600000 });

module.exports = StylesheetController;

function StylesheetController() {

}

/**
 * Output the latest/specified version of the CSS for the active group. If it
 * detects that the specified CSS version is out of date, the stylesheet is
 * re-compiled before outputting to browser.
 * 
 * @param  {context} c - http context
 */
StylesheetController.prototype.css = function (c) {
    var css = null;
    
    // get the stylesheet object
    c.Stylesheet.findOne({ where: { groupId: c.req.group.id }}, function (err, stylesheet) {
        // load the default stylesheet if none is found
        if (!stylesheet) {
            console.log('Stylesheet: not found. Setting default theme');

            stylesheet = new c.Stylesheet();
            stylesheet.groupId = c.req.group.id;
            stylesheet.version = 0;
            stylesheet.setTheme('default', function () {
                output(stylesheet.css);
            });
        } else {
            if (stylesheet.less && (stylesheet.lastUpdate < c.Stylesheet.lastUpdate || typeof stylesheet.lastUpdate === 'undefined')) {
                console.log('Stylesheet: out of date stylesheet - recompiling');

                stylesheet.compile(function () {
                    stylesheet.save(function () {
                        output(stylesheet.css);
                    });
                });
            } else {
                css = stylesheet.css;
                output(css);
            }
        }

        // sends the css output to the browser
        function output(css) {
            c.res.writeHead(200, {
                'Cache-Control': 'public, max-age=' + (31557600000),
                'Content-Encoding': 'gzip',
                'Content-Type': 'text/css; charset=UTF-8'
            });

            // zip the response
            zlib.gzip(css, function(err, buffer) {
                c.res.write(buffer);
                c.res.end();
            });
        }
    });
};

/**
 * Output the specified theme.
 * 
 * @param  {context} c - http context
 */
StylesheetController.prototype.theme = function (c) {
    var stylesheet;

    c.Stylesheet.all({ where: { name: c.req.params.name }}, function(err, stylesheets) {
        if(stylesheets.length === 0) {
            stylesheet = new c.Stylesheet();
            stylesheet.name = c.req.params.name;
            stylesheet.version = 0;

            stylesheet.setTheme(c.req.params.name, function(err, stylesheet) {
                if (err) {
                    return c.sendError({
                        error: err
                    });
                }
                output(stylesheet.css);
            });
        }
        else {
            stylesheet = stylesheets[0];
            
            if(stylesheet.less && (stylesheet.lastUpdate < c.Stylesheet.lastUpdate || typeof stylesheet.lastUpdate == 'undefined')) {
                console.log('Stylesheet: out of date stylesheet - recompiling');
                stylesheet.setTheme(stylesheet.name, function () {
                    output(stylesheet.css);
                });
            }
            else {
                output(stylesheet.css);
            }
        }

        // sends the css output to the browser
        function output(css) {
            c.res.writeHead(200, {
                'Cache-Control': 'public, max-age=' + (31557600000),
                'Content-Encoding': 'gzip',
                'Content-Type': 'text/css; charset=UTF-8'
            });

            // zip the response
            zlib.gzip(css, function(err, buffer) {
                c.res.write(buffer);
                c.res.end();
            });
        }
    });
};

/**
 * Display a font-awesome font. This routes requests via express.static through
 * to the FontAwesome directory within node_modules.
 *
 * TODO: think of a better way to allow this via standard /public without
 * modifying the font-awesome core.
 * 
 * @param  {context} c - http context
 */
StylesheetController.prototype.font = function (c) {
    fontStatic(c.req, c.res, function () {
        c.send('404. Error loading: ' + c.req.url);
    });
};

