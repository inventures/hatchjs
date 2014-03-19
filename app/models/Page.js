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

var async = require('async');
var ejs = require('ejs');
var path = require('path');
var request = require('request');
var qs = require('querystring');
var http = require('http');
var _ = require('underscore');

module.exports = function (compound, Page) {
    Page.validatesPresenceOf('title', {message: 'Please enter a title'});
    Page.validatesUniquenessOf('url');

    // register the functions which can be called from the REST api
    Page.allowedApiActions = [
        'getUrlName', 
        'toMinimalObject', 
        { name: 'save', permission: 'save' }
    ];

    /**
     * gets the last part of the url of this page after the last '/'
     * 
     * @return {[String]} 
     */
    Page.prototype.getUrlName = function(page) {
        if(!page) page = this;

        var regex = /(\/[^\:^\/]+)/ig;
        if(!page.url || page.url.search(regex) === -1) {
            return '';
        } else {
            var matches = page.url.match(regex);
            return page.url.substring(page.url.lastIndexOf(matches[matches.length -1]) +1);
        }
    };

    /**
     * updates the parent group after this page has been saved to the database
     * 
     * @param  {Function} next [continuation function]
     */
    Page.afterSave = function(next) {
        // after we save a template, make sure to update the group so that the template cache is updated
        Page.updateGroup(this.groupId);

        next();
    };

    Page.grids = compound.hatch.grids;

    /**
     * creates a new page and saves to the database
     * 
     * @param  {[json]}   data [page data to create with]
     * @param  {Function} done [continuation function]
     */
    Page.createPage = function (data, done) {
        if (!data.url && data.title) {
            data.url = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        }

        //fix the data.url for the page and save
        fixPageUrl(data, function(err, data) {
            if(err) {
                var page = new Page(data);
                page.errors = {parent: ['page not found']};

                return done(err, page);
            }
            return Page.create(data, function(err, page) {
                Page.updateGroup(page.groupId);
                done(err, page);
            });
        });
    };

    /**
     * updates a page and saves to the database
     * 
     * @param  {[json]}   data [page update data]
     * @param  {Function} done [continuation function]
     */
    Page.prototype.update = function (data, done) {
        var self = this;
        var oldUrl = self.url;

        //if we have no parentId - this is the homepage - skip the url fixing code because the url cannot be changed from here
        if(!self.parentId) {
            self.updateAttributes(data, function(err) {
                done(err, self);
            });
            return;
        }

        //if a url was not specified, automatically generate it from the title
        if (!data.url) {
            data.url = this.url.replace(/\/$/g, '').replace(/[^\/]+$/, data.title);
        }

        //if url was not changed, exit this function
        if (!data.url || this.url === data.url) {
            Page.updateGroup(self.groupId);
            return this.updateAttributes(data, done);
        }

        //fix the data.url for the page and save
        fixPageUrl(data, function(err, data) {
            if(err) return done(err);
            self.updateAttributes(data, function (err, page) {
                if (err) return done(err, page);

                //update child page urls accordingly
                cascadingUpdate(page, function () {
                    Page.updateGroup(self.groupId);
                    done(null, page);
                });
            });
        });

        /**
         * updates child page urls based on changes made to this page's url
         * 
         * @param  {[type]}   root [the root page being updated]
         * @param  {Function} done [continuation function]
         */
        function cascadingUpdate(root, done) {
            Page.all({where: {groupId: root.groupId}}, function (err, pages) {
                var subtree = Page.tree(pages, root.id);
                var wait = subtree.length;
                if (wait === 0) return done();
                subtree.forEach(function (page) {
                    page.updateAttribute('url', page.url.replace(oldUrl, root.url), ok);
                });

                function ok() {
                    if (--wait === 0) done();
                }
            });
        }
    };

    /**
     * fixes the page url in the data used to create or update a page
     * 
     * @param  {[json]}   data [data containing the page information we want to save]
     * @param  {Function} next [continuation function]
     */
    function fixPageUrl(data, done) {
        //if the parent page is explicitly defined
        if(data.parentId) {
            Page.find(data.parentId, function(err, parent) {
                if (err) {
                    return done(err);
                }
                if (!parent) {
                    return done(new Error('Target parent page not found'));
                }
                if (parent.url.indexOf(currentUrl + '/') === 0) {
                    return done(new Error('Could not move page to his child'));
                }

                //adjust the url
                if((data.url || '').search(/(\/[^\:^\/]+)/ig) == -1) {
                    if(data.customUrl === 'false') data.url = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                    data.url = (parent.url + '/' + data.url).replace('//', '/');
                    newUrl = data.url;
                }

                data.parentId = parent.id;
                data.groupId = parent.groupId;

                done(null, data);
            });
        }  
        //parent page is implied from url
        else if(data.url.indexOf('/') > -1) {
            var parentUrl = data.url.replace(Page.prototype.getUrlName(data), '');

            if (parentUrl[parentUrl.length -1] == '/') parentUrl = parentUrl.substring(0, parentUrl.length -1);
            // if (parentUrl.indexOf('/') === -1) parentUrl += '/';

            var currentUrl = this.url;

            Page.all({where: {url: parentUrl}}, function (err, parent) {
                if (err) {
                    return done(err);
                }
                parent = parent[0];
                if (!parent) {
                    console.log('parent page not found');
                    return done(new Error('Target parent page not found'));
                }
                if (parent.url.indexOf(currentUrl + '/') === 0) {
                    return done(new Error('Could not move page to his child'));
                }

                data.parentId = parent.id;
                data.groupId = parent.groupId;

                done(null, data);
            });
        } 
        //parent page not defined - fix?
        else {
            //special page - always set parent to homepage
            if(data.type != 'page') {
                compound.models.Group.find(data.groupId, function(err, group) {
                    data.parentId = group.homepage.id;
                    data.url = path.join(group.homepage.url, data.url);

                    done(null, data);
                });

                return;
            }
            // Data type is page, but no parent is defined
            return done(new Error('Target parent page not found'));
        }
    }

    /**
     * Delete a page
     * 
     * @param  {Function} done [continuation function]
     */
    Page.prototype.destroyPage = function (done) {
        var baseURL = this.url.replace(/[^\/]+$/, '');
        var page = this;
        Page.all({where: {parentId: this.id}}, function (err, pages) {
            var wait = pages.length + 1;
            pages.forEach(function (page) {
                if(page.url == null) {
                    ok();
                    return;
                };
                page.update({
                    url: baseURL + page.url.split('/').pop()
                }, function () {
                    ok();
                });
            });

            ok();

            function ok() {
                if (--wait === 0) fine();
            }
        });

        function fine() {
            page.destroy(function() {
                Page.updateGroup(page.groupId);
                done();
            });
        }
    };

    Page.prototype.renderHtml = function (req, callback) {
        var result = {}, self = this;

        async.forEach(self.widgets.items, function (widget, next) {
            self.canSeeWidget(req.user, widget, req.group, function (err, permission) {
                if (permission) {
                    self.renderWidgetAction(req, widget, function (err, html) {
                        if (!result[widget.id]) {
                            if (err) {
                                if (req.app.enabled('show errors')) {
                                    result[widget.id] = err.stack || err;
                                } else {
                                    result[widget.id] = 'Error in widget rendering';
                                }
                            } else {
                                result[widget.id] = html;
                            }
                        }
                        next();
                    });
                } else {
                    result[widget.id] = '';
                    next();
                }
            });
            
        }, done);

        function done() {
            var cols = [], sizes = [];
            self.columns.forEach(function (col) {
                var html = '';
                col.widgets.forEach(function (widgetId) {
                    html += result[widgetId];
                });
                cols.push(html);
                sizes.push(col.size);
            });

            var grid = req.agent && req.agent.mobile ? ('m.' + self.grid) : self.grid;
            var gridHtml = Page.grids[grid] || Page.grids[self.grid] || Page.grids['02-two-columns'] || [''];

            // log the total render time
            // compound.log('RENDER [' + (new Date() - req.startedAt) + 'ms]');
            // compound.log('---------------');

            try {
                callback(null, ejs.render(gridHtml[0], {
                    column: cols,
                    page: self,
                    size: sizes,
                    filename: grid + (self.templateId || ''),
                    cache: true
                }));
            } catch(e) {
                compound.log(e.stack);
                callback(e);
            }
        }
    };

    /**
     * Check a user's permissions to view the specified widget.
     * 
     * @param  {User}     user     - user to check
     * @param  {Widget}   widget   - widget to check
     * @param  {Group}    group    - group to check
     * @param  {Function} callback - callback function
     */
    Page.prototype.canSeeWidget = function (user, widget, group, callback) {
        if (widget.settings) {
            if (widget.settings.privacy === 'members-only') {
                if (!user) {
                    return callback(null, false);
                }
                return user.hasPermission(group, 'view', callback);
            } else if (widget.settings.privacy === 'private') {
                if (!user) {
                    return callback(null, false);
                }
                return user.hasPermission(group, 'edit', callback);
            } else if (widget.settings.privacy === 'non-registered') {
                if (user) {
                    return callback(null, false);
                }
            }
        }

        callback(null, true);
    };

    Page.prototype.renderWidgetAction = function renderWidgetAction(parentRequest, widget, action, params, callback) {
        if('function' == typeof(action)) {
            callback = action;
            action = 'show';
            params = null;
        }
        else if('function' == typeof(params)) {
            callback = params;
            params = null;
        }

        var widgetId;
        if (typeof widget === 'object' && widget.id) {
            widgetId = widget.id;
        } else {
            widgetId = widget;
            widget = this.widgets[widgetId];
        }
        if (!widget) {
            return callback(new Error('Widget id=' + widgetId + ' not found'));
        }
        if (!widget.type) {
            return callback(new Error('Widget has no type specified'));
        }
        var moduleName = widget.type.split('/')[0];
        var widgetName = 'widgets/' + widget.type.split('/').slice(1).join('/');
        var module = compound.hatch.modules[moduleName];
        if (!module) {
            return callback(new Error('Module ' + moduleName + ' not loaded'));
        }
        var req = {};

        // create a new 'request' from scratch and copy over all of the required properties from the parent request
        [
            'user', 'group', 'page', 'post', 'cookies', 'session',
            'compound', 'method', 'app', 'pagePath', 'agent', 'query', 'params'
        ].forEach(function (key) {
            req.__defineGetter__(key, function() {
                return parentRequest[key];
            });
        });

        // copy the param function
        req.param = parentRequest.param;

        req.url = '/widget/' + widget.type;
        req.headers = {'user-agent': parentRequest.headers['user-agent']};
        // req.params = {};
        req.body = {};
        req.locals = {};
        req.body.data = {
            data: params,
            widgetId: widget.id,
            templateWidget: false
        };

        var res = new http.ServerResponse({method: 'NOTHEAD'});

        res.controllerName = widgetName.split('/')[0];
        res.compound = module.compound;
        res.req = req;
        res.context = {
            req: req,
            res: res,
            inAction: true
        };
        var endCalled = false;
        res.render = function (file, viewContext, next) {
            compound.app.render(file, viewContext, next || callback);
        };
        res.send = function (body) {
            callback(null, body);
        };
        res.end = function(body) {
            endCalled = true;
            callback(null, body);
        };

        module.compound.controllerBridge.callControllerAction(widgetName, action, req, res, function(err) {
            if (!endCalled) {
                endCalled = true;
                if (err) {
                    callback(err);
                }
            }
        });
    };

    Page.prototype.pathname = function (req) {
        return this.url.replace(req.group.homepage.url, '').replace(/^\/|\/$/g, '');
    };

    /**
     * updates a group by recalculation the pages cache data
     * 
     * @param  {[Number]} groupId [id of group to update]
     */
    Page.updateGroup = function (groupId, next) {
        var Group = compound.models.Group;
        Group.find(groupId, function (err, group) {
            if(!group) {
                if(next) {
                    next(err, group);
                }
                return;
            }
            Page.all({where: {groupId: groupId}}, function (err, pages) {
                group.pagesCache = [];
                pages.forEach(function (page) {
                    group.pagesCache.push(page.toMinimalObject());
                    if (group.homepage && group.homepage.id == page.id) {
                        group.homepage = page.toMinimalObject();
                        group.url = group.homepage.url;
                    }
                });
                group.pagesCache = Page.tree(group.pagesCache);
                group.save();

                if (next) {
                    next(err, group);
                }
            });
        });
    };

    /**
     * Merges a template with the current page
     * 
     * @param  {[Page]} template [template to merge]
     */
    Page.prototype.mergeTemplate = function (template) {
        var page = this;

        template.widgets.forEach(function (w) {
            w.notEditable = true;
            w.templateWidget = true;
        });

        template.columns.forEach(function (col, i) {
            if (col.widgets && col.widgets.length) {
                col.fromTemplate = true;
                page.columns[i] = col;
            } else {
                page.columns[i] = page.columns[i] || {widgets: []};
                page.columns[i].size = col.size;
            }
        });

        page.templateWidgets = template.widgets;
        page.grid = template.grid;
    };

    /**
     * returns the minimal object for this page for use in group.pagesCache
     * 
     * @return {[Page]} 
     */
    Page.prototype.toMinimalObject = function () {
        var obj = {
            id: this.id,
            title: this.title,
            url: this.url,
            order: this.order,
            level: this.level,
            parentId: this.parentId,
            type: this.type,
            hideFromNavigation: this.hideFromNavigation
        };
        if (obj.type === 'template') {
            obj.columns = this.columns;
            obj.widgets = this.widgets;
            obj.grid = this.grid;
        }
        return obj;
    };

    /**
     * Build a page hierarchy structure.
     * 
     * @param  {Page[]} pages - initial page collection
     * @return {Page[]}
     */
    Page.hierarchy = function (pages) {
        pages.forEach(function (page) {
            if (page.level === 0) {
                return;
            }

            page.pages = pages.filter(function (p) {
                return p.parentId == page.id;
            });
        });

        return pages.filter(function (page) {
            return (page.level === 0 || page.level === 1) && [null, 'page', 'homepage'].indexOf(page.type) > -1;
        });
    };

    /**
     * Build the breadcrumb trail for the specified page.
     * 
     * @param  {Page[]} pages - initial page collection
     * @param  {Page}   page  - page that we are on
     * @return {Page[]}       
     */
    Page.breadcrumb = function (pages, page) {
        var breadcrumb = [page];

        pages = pages.reverse();
        pages.forEach(function (p) {
            if (p.id == page.parentId) {
                breadcrumb.push(p);
                page = p;
            }
        });

        return breadcrumb.reverse();
    };

    /**
     * builds the page hierarchy tree for navigation display
     * 
     * @param  {[list]} collection [list of pages]
     * @param  {[Page]} root       [root of the group pages tree]
     * @return {[list]}            [the re-arranged list]
     */
    Page.tree = function (collection, root) {
        var result = [];
        var index = {};
        collection.forEach(function (page) {
            var id = page.parentId || 'root';
            index[id] = index[id] || [];
            index[id].push(page);
        });
        walk(root || 'root');
        return result;

        function walk(id, level) {
            level = level || 0;
            if (!index[id]) return;
            index[id].sort(function (pageA, pageB) {
                return pageA.order > pageB.order ? 1 : -1;
            });
            index[id].forEach(function (page) {
                page.level = level;
                result.push(page);
                if (page.id !== id) {
                    walk(page.id, level + 1);
                }
            });
        }
    };

    /**
     * Remove a widget by specifying it's id
     * 
     * @param  {Number} widgetId - id of widget to remove
     */
    Page.prototype.removeWidget = function (widgetId, callback) {
        // remove from the cols
        this.columns.forEach(function (col) {
            col.widgets = _.reject(col.widgets, function (id) {
                return id == widgetId;
            });
        });

        // remove the widget
        this.widgets.items = _.reject(this.widgets.items, function(widget) {
            return widget.id == widgetId;
        });

        this.save(callback);
    };


    /**
     * Remove widgets which are not part of the columns from this page.
     */
    Page.prototype.removeRedundantWidgets = function () {
        var ids = [];
        this.columns.forEach(function (col) {
            col.widgets.forEach(function (id) {
                ids.push(id);
            });
        });

        this.widgets.items = _.reject(this.widgets.items, function(widget) {
            return ids.indexOf(widget.id) === -1;
        });
    };

};

