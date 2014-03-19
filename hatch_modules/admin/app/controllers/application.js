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

var _ = require('underscore');
var async = require('async');

// Load the required data and populate the locals
function populateLocals(c) {
    c.locals._ = _;
    c.locals.subTabs = [];

    // set the active admin section (main tab)
    c.locals.sectionName = c.req.originalUrl.split('/do/')[1].split('/')[1].split('?')[0];
    c.locals.pageName = c.actionName;
    c.locals.tabs = _.sortBy(c.compound.tabs, 'rank');

    // request and group for views
    c.locals.req = c.req;
    c.locals.group = c.req.group;

    // get the page that we are working on
    if (c.req.query.pageId && isNaN(parseInt(c.req.query.pageId, 10))) {
        var url = c.req.query.pageId.replace(/^.*?\//, '/');
        c.req.group.definePage(url, c, function(err, page) {
            c.req.page = page;
            c.next();
        });
    } else if (c.req.query.pageId) {
        c.Page.find(c.req.query.pageId, function (err, page) {
            c.req.page = page;
            c.next();
        });
    } else {
        c.next();
    }
}

// Check whether the current user can manage this group.
function checkPermissions(c) {
    var isAdmin = c.req.user && c.req.user.adminOf(c.req.group);
    if (isAdmin) {
        c.next();
    } else {
        c.redirect('//' + c.req.page.url);
    }
}

// load all of the different content types that have been defined in the app
function loadContentTypes(c) {
    c.locals.contentTypes = c.compound.hatch.contentType.getAll();
    c.locals.editableContentTypes = c.compound.hatch.contentType.getEditable();
    c.next();
}

// setup the default member roles for the app
function loadMemberRoles(c) {
    c.locals.memberRoles = [
        { name: 'members', icon: 'user', filter: 'member' },
        { name: 'editors', icon: 'star', filter: 'editor' },
        { name: 'pending', icon: 'time', filter: 'pending' },
        { name: 'blacklisted', icon: 'flag', filter: 'blacklisted' }
    ];
    c.next();
}

/**
 * Instantiate the admin application base controller. Handles security
 * and loads data required by all of the admin controllers.
 * 
 * @param  {context} init - initialiser.
 */
var Application = function Application(init) {
    init.before(checkPermissions);
    init.before(populateLocals);
    init.before(loadContentTypes);
    init.before(loadMemberRoles);
};

module.exports = Application;

// tab groups builder functions
Application.tabGroups = { hashes: [] };

/**
 * Install a new subTab building function for the specified sectionName
 * 
 * @param  {String}   sectionName - e.g. content, users, group
 * @param  {Function} fn          - function (c) { var tabs = []; return tabs; }
 */
Application.installTabGroup = function (sectionName, fn) {
    if (!Application.tabGroups[sectionName]) {
        Application.tabGroups[sectionName] = [];
    }

    // make sure we are not installing the same tab builder twice
    if (Application.tabGroups.hashes.indexOf(fn.toString()) === -1) {
        Application.tabGroups[sectionName].push(fn);
        Application.tabGroups.hashes.push(fn.toString());
    }
};

/**
 * Setup the tabs based in the tab group building functions.
 * 
 * @param  {HttpContext} c - context
 */
Application.setupTabs = function (c, next) {
    if (Application.tabGroups[c.locals.sectionName]) {
        // TODO: test to see if function container module is enabled for this group
        async.forEach(Application.tabGroups[c.locals.sectionName], function (fn, next) {
            var subTabs = fn(c, done);
            if (subTabs) {
                done(null, subTabs);
            }

            function done(err, tabs) {
                tabs.forEach(function (tab) {
                    c.locals.subTabs.push(tab);
                });

                next();
            }
        }, setActiveTab);
    }

    function setActiveTab() {
        if (c.locals.subTabs) {
            // set the active subtab
            c.locals.subTabs.map(function (tab) {
                if (c.req.originalUrl.split('?')[0] == (c.pathTo[tab.url] || tab.url)) {
                    tab.active = true;
                }
            });
        }

        if (c.locals.filterTabs) {
            // set the active subtab
            c.locals.filterTabs.map(function (tab) {
                if (c.req.originalUrl.split('?')[0] == (c.pathTo[tab.url] || tab.url)) {
                    tab.active = true;
                }
            });
        }

        if (next) {
            next();
        }
    }
};

/**
 * Default admin action. Redirect to content.
 */
Application.prototype.index = function (c) {
    c.redirect(c.pathTo.content);
};