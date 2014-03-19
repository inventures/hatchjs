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

var googleImages = require('google-images');
var google = require('google');

var Application = require('./application');

module.exports = PageController;

function PageController(init) {
    Application.call(this, init);
    init.before(findPage);
}

// finds the page that we are performing the action on
function findPage (c) {
    if (c.req.query.pageId) {
        c.Page.find(c.req.query.pageId, function (err, page) {
            c.req.page = page;
            c.next();
        });
    } else {
        c.req.group.definePage(c.req.pagePath, c, function (err, page) {
            c.req.page = page;
            c.next();
        });
    }
}

require('util').inherits(PageController, Application);

/**
 * Show the edit console for this page.
 * 
 * @param  {HttpContext} c - http context
 */
PageController.prototype.editconsole = function editConsole(c) {
    c.req.widgets = [];
    var groupModulesIndex = {};
    var tab = c.req.query.tab || '';
    var view = (tab ? '_':'') + 'editconsole' + tab;

    // get the modules that are loaded for this group
    c.req.group.modules.forEach(function (m) {
        if (m) groupModulesIndex[m.name] = m;
    });

    // load the widgets to show on the edit console
    c.compound.hatch.widget.getWidgets().forEach(function (w) {
        if (groupModulesIndex[w.module]) {
            // if the widget is restricted to special pages only, only show if it matches the type
            if (w.widget.info.special && w.widget.info.special !== c.req.page.type) {
                return;
            }

            c.req.widgets.push({
                name: w.name,
                module: w.module,
                info: w.widget.info
            });
        }
    });

    // load the grids to show on the edit console
    c.req.grids = [];
    var hatch = c.app.parent.parent.compound.hatch;
    Object.keys(hatch.grids).forEach(function (name) {
        c.req.grids.push({
            name: name,
            html: hatch.grids[name][0],
            preview: hatch.grids[name][1]
        });
    });

    // load the themes
    c.locals.themes = c.compound.hatch.themes.getThemes();
    
    c.render(view, { layout : false });
};

/**
 * Update the grid for this page.
 * 
 * @param  {HttpContext} c - http context
 */
PageController.prototype.updateGrid = function(c) {
    var page = c.req.page;
    page.grid = c.body.grid;

    // reset all of the column sizes - they won't fit the new grid anyway
    page.columns.forEach(function (col) {
        col.size = false;
    });

    // if we are modifying a page which doesn't yet exist in the database 
    // (default special page), use the createPage function instead of save
    if (!page.id) {
        page.save = function(done) {
            c.Page.createPage(page, done);
        };
    }

    // save the page and re-render the column contents
    page.save(function (err) {
        if (err) {
            return c.sendError(err);
        }

        // reload the page to get the latest changes from db
        c.Page.find(page.id, function(err, page) {
            page.renderHtml(c.req, function (err, html) {
                c.send({html: html});
            });
        });
    });
};

/**
 * Update the column widths or the widget positions for this page.
 * 
 * @param  {HttpContext} c - http context
 */
PageController.prototype.updateColumns = function(c) {
    c.req.page.columns = JSON.parse(c.body.widgets);
    c.req.page.removeRedundantWidgets();
    c.req.page.save(function (err) {
        if (err) {
            return c.sendError(err);
        }
        
        c.send('ok');
    });
};

/**
 * Show the richtext insert image dialog.
 * 
 * @param  {HttpContext} c - http context
 */
PageController.prototype.image = function(c) {
    c.Media.all({ where: { userId: c.req.user.id, type: 'image'}}, function(err, images) {
        c.locals.images = images;
        c.render('image', { layout: false });
    });
};

/**
 * Search for images on google to add to the media library.
 * 
 * @param  {HttpContext} c - http context
 */
PageController.prototype.imageSearch = function(c) {
    googleImages.search(c.req.body.query, function(err, images) {
        c.send(images);
    });
};

/**
 * Show the richtext insert link dialog.
 * 
 * @param  {HttpContext} c - http context
 */
PageController.prototype.link = function(c) {
    c.render('link', { layout: false });
};

/**
 * Search google for links to insert.
 * 
 * @param  {HttpContext} c 
 */
PageController.prototype.linkSearch = function(c) {
    google(c.req.body.query, function(err, next, links) {
        c.send(links);
    });
};
