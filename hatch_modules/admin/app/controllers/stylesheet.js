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

'use strict';

module.exports = StylesheetController;

function StylesheetController(init) {
    init.before(findStylesheet);
}

// finds the stylesheet for the current group
function findStylesheet (c) {
    c.Stylesheet.findOne({ where: { groupId: c.req.group.id }}, function (err, stylesheet) {
        c.stylesheet = stylesheet;
        c.next();
    });
}

// sends a response to the browser based on the stylesheet model response
function sendResponse (c, err, params) {
    if (err) {
        return c.sendError(err);
    }

    var isStatic = c.app.enabled('static css');
    var url = isStatic ? params.url : c.pathFor('stylesheet').css(params.version);
    
    c.send({
        status: 'success',
        url: url
    });
}

/**
 * Load the current stylesheet and return as JSON.
 * 
 * @param  {HttpRequest} c - http context
 */
StylesheetController.prototype.load = function (c) {
    c.send({
        stylesheet: c.stylesheet
    });
};

/**
 * Set the theme.
 * 
 * @param  {HttpContext} c - http context
 */
StylesheetController.prototype.setTheme = function (c) {
    c.stylesheet.setTheme(c.req.query.name, function (err, params) {
        sendResponse(c, err, params);
    });
};

/**
 * Set the LESS code for the stylesheet.
 * 
 * @param {HttpContext} c - http context
 */
StylesheetController.prototype.setLess = function (c) {
    c.stylesheet.setLess(c.req.body.less, function (err, params) {
        sendResponse(c, err, params);
    });
};

/**
 * Set one or more CSS rules for the stylesheet.
 * 
 * @param {HttpContext} c - http context
 */
StylesheetController.prototype.setRules = function (c) {
    c.stylesheet.setRules(c.req.body.rules, function (err, params) {
        sendResponse(c, err, params);
    });
};
