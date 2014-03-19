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

var path = require('path');

module.exports = function (compound, Group) {

    var Page = compound.models.Page;
    var Content = compound.models.Content;
    var User = compound.models.User;
    var _ = require('underscore');
    var async = require('async');

    Group.hasMany(Page, {as: 'pages', foreignKey: 'groupId'});

    /**
     * Before a group is saved, make sure the URLs are up to date.
     *
     * @param  {JSON}     data - data to save
     * @param  {Function} next - continuation function
     */
    Group.beforeCreate = Group.beforeSave = function (next, data) {
        if (data.id) {
            Group.updatePageUrls(data, next);
        } else {
            data.createdAt = new Date();
            next();
        }
    };

    /**
     * Find a group for the specfied URL.
     *
     * @param  {String}   url      - URL to search for
     * @param  {Function} callback - callback function
     */
    Group.findByUrl = function (url, callback) {
        function find (url, callback) {
            Group.findOne({ where: { pageUrls: url }}, function (err, group) {
                if (!group) {
                    Content.findOne({ where: { url: url }}, function (err, post) {
                        if (post) {
                            return callback(err, null, post);
                        } else {
                            if (url.indexOf('/') > -1) {
                                url = url.substring(0, url.lastIndexOf('/'));
                                return find(url, callback);
                            } else {
                                return callback(err, group);
                            }
                        }
                    });
                } else {
                    return callback(err, group);
                }
            });
        }

        find(url, callback);
    };

    /**
     * Update a group's URLs by getting the updated list from the pages within.
     *
     * @param  {Group}    group    - group to update
     * @param  {Function} callback - callback function
     */
    Group.updatePageUrls = function (group, callback) {
        Page.all({ where: { groupId: group.id }}, function (err, pages) {
            pages = _.filter(pages, function (page) { return page !== null && page.url; });
            group.pageUrls = _.pluck(pages, 'url');
            callback();
        });
    };

    /**
     * Get the path part of the URL for this group's homepage.
     *
     * @return {String} - group path
     */
    Group.getter.path = function () {
        return this._url && this._url.replace(/[^\/]+/, '');
    };

    /**
     * Get the value of a setting within a module in this group.
     *
     * @param  {String} name - full dot-notation setting name - e.g.
     *                         core-settings.settingName
     * @return {String}
     */
    Group.prototype.getSetting = function (name) {
        var moduleName = name.split('.')[0];
        var setting = name.split('.')[1];
        var module = this.getModule(moduleName);

        if (!module) {
            return null;
        }

        var result = module.contract[setting];
        if (!result) {
            var defaultModule = compound.app.get(moduleName);
            if(!defaultModule) {
                return null;
            }
            result = defaultModule[setting];
        }

        return result;
    };

    /**
     * Find special page by it's relative path
     *
     * @param {String} pathname - relative page path with no domain or group
     * path, it could not start with '/'. for root page it just blank string.
     *
     * @returns Object or Page
     */
    Group.prototype.matchSpecialPage = function (pathname) {
        var group = this;
        var fullPagePath = path.join(this.url.match(/^[^\/]+/)[0], pathname);
        fullPagePath = fullPagePath.replace(/\/$/, '').split('?')[0];
        var found = null;
        this.pagesCache.forEach(function (page) {
            if (page.type !== 'page') {
                var sp = compound.hatch.page.get(page.type);
                if (sp && sp.matchRoute) {
                    var p = sp.matchRoute(group, pathname);
                    if (p) {
                        found = page;
                        found.handler = sp.handler;
                        found.specialPageParams = p;
                    }
                }
            }
        });

        if (!found) {
            var special = compound.hatch.page.match(this, pathname);
            var page = special[0];
            var params = special[1];
            if (page && page.defaultPage) {
                found = group.pages.build(page.defaultPage);
                found.url = this.homepage.url + '/' + page.defaultPath;
                found.type = found.type || special.type;
                found.grid = found.grid || '02-two-columns';
                found.handler = page.handler;
                found.specialPageParams = params;
            }
        }

        console.log(found)

        return found;
    };

    /**
     * Define the page for the current request context.
     *
     * @param  {String}        url      - current url
     * @param  {HttpContext}   c        - http context
     * @param  {Function}      callback - callback function
     */
    Group.prototype.definePage = function definePage(url, c, callback) {
        // remove trailing and leading slashes
        url = url.replace(/^\/|\/$/g, '');

        var group = this;
        var path = url.split('?')[0];
        var page = c.req.page || this.matchSpecialPage(path);

        // special page out of this group (sp.defaultPage)
        if (page && page.type !== 'page') {
            var handler = page.handler;
            c.req.specialPageParams = page.specialPageParams;
        }

        if (!page) {
            callback(null, null);
        } else if (page.renderHtml) {
            gotPage(null, page);
        } else if (page.id) {
            Page.find(page.id, gotPage);
        } else {
            gotPage(null, page);
        }

        function gotPage(err, page) {
            if (page && page.templateId) {
                var found = group.getCachedPage(page.templateId);

                if (found) {
                    page.mergeTemplate(new Page(found));
                    return callback(err, page);
                }
            }

            // store the page in the request
            c.req.page = page;
            if (handler) {
                handler(c, function() {
                    callback(err, page);
                });
            } else {
                callback(err, page);
            }
        }
    };

    /**
     * Get a cached page from this group's pagesCache.
     *
     * @param  {Number} id - page.id
     * @return {Page}      - page object
     */
    Group.prototype.getCachedPage = function getCachedPage(id) {
        var found;
        this.pagesCache.forEach(function (p) {
            if (p.id == id) {
                found = p;
            }
        });
        return found;
    };

    /**
     * Clone this group and save the new group to the database.
     *
     * @param  {Object}     params   - clone parameters
     * @param  {Function}   callback - continuation function
     */
    Group.prototype.clone = function (params, callback) {
        var oldGroup = this;
        var newUrl = params.url;
        var newName = params.name;

        if (!newUrl || !newName) {
            return callback(new Error('Name and URL required'));
        }

        var g = oldGroup.toObject();
        var oldUrl = g.homepage.url;
        delete g.id;
        // quick fix homepage
        // TODO: move to juggling
        var hp = {};
        for (var i in g.homepage) hp[i] = g.homepage[i];
        g.homepage = hp;
        g.url = newUrl;
        g.homepage.url = newUrl;
        g.pagesCache = [];
        g.name = newName;
        g.locale = oldGroup.locale;

        // remove slash from the end of group url
        newUrl = newUrl.replace(/\/$/, '');

        var pages, group;
        var pageIds = {};

        Page.findOne({where: { url: newUrl }}, function (err, p) {
            if (p) {
                return callback(new Error('URL already taken'));
            }
            createGroup();
        });

        function createGroup() {
            Group.create(g, function (err, gg) {
                group = gg;
                oldGroup.pages(function (err, ps) {
                    if (ps.length === 0) {
                        return callback(null, group);
                    }
                    pages = Page.tree(ps).map(function (page) {
                        var p = page.toObject();
                        p.url = p.url.replace(oldUrl, newUrl + '/');
                        p.url = p.url.replace('//', '/');
                        p.groupId = group.id;
                        return p;
                    });
                    createHomepage(
                        createTemplates.bind(null, createPages)
                    );
                });
            });
        }

        function createHomepage(done) {
            var calledOnce = false;
            pages.forEach(function (p) {
                if (calledOnce) return
                if (p.url === newUrl + '/') {
                    calledOnce = true;
                    p.url = newUrl;
                    var oldId = p.id;
                    delete p.id;
                    Page.create(p, function (err, page) {
                        pageIds[oldId] = page.id;

                        group.homepage.id = page.id;
                        group.save(done);
                        pages.forEach(function (p) {
                            if (p.parentId === oldId) {
                                p.parentId = page.id;
                            }
                        });
                    });
                }
            });
        }

        function createTemplates(done) {
            var wait = 1;
            pages.forEach(function (p) {
                if (p.type === 'template') {
                    var oldTemplateId = p.id;

                    delete p.id;
                    delete p.parentId;
                    wait += 1;
                    Page.create(p, function (err, page) {
                        pageIds[oldTemplateId] = page.id;

                        pages.forEach(function (p) {
                            if (p.templateId === oldTemplateId) {
                                p.templateId = page.id;
                            }
                        });
                        ok();
                    });
                }
            });

            ok();

            function ok() {
                if (--wait === 0) done();
            }
        }

        function createPages() {
            var p = pages.shift();
            if (!p) {
                Page.updateGroup(group.id, function (err, group) {
                    callback(null, group);
                });
                return;
            }
            var oldId = p.id;
            delete p.id;

            p.parentId = pageIds[p.parentId];

            Page.create(p, function (err, page) {
                if (oldId) {
                    pageIds[oldId] = page.id;
                }

                createPages();
            });
        }
    };

    /**
     * Set the specified user as the owner of this group.
     *
     * @param {User}     user     - new owner
     * @param {Function} callback - callback function
     */
    Group.prototype.setOwner = function (user, callback) {
        var membership = user.memberships.find(this.id, 'groupId');

        if (!membership) {
            membership = {
                groupId: this.id,
                joinedAt: new Date(),
                role: 'owner',
                state: 'accepted'
            };

            user.memberships.push(membership);
        }

        membership.role = 'owner';
        membership.state = 'accepted';

        user.save(callback);
    }

    // TODO: deprecate
    Group.prototype.handle = function groupEventHandler(name, env, done) {
        // group can handle some events
        // depending on special pages added to group
        // we need to iterate through special pages
        var sph, pageId;
        this.pagesCache.forEach(function (page) {
            if (!page.type || page.type === 'page') {
                return;
            }
            var sp = env.api.module.getSpecialPage(page.type);
            if (sp.respondTo === name) {
                sph = sp;
                pageId = page.id;
            }
        });
        // checking wich pages responds to that events
        // if appropriated page was found
        if (sph) {
            Page.find(pageId, function (err, page) {
                env.req.page = page;
                env.next = function() {
                    env.res.send(env.res.html);
                };

                // run page's special handler
                if (sph.handler) {
                    console.log('got special page for that event', name);
                    sph.handler(env, function () {
                        // and then pass controll to admin/page#show (using pubsub->page)
                        env.api.pubsub.emit('page', env);
                    });
                } else {
                    env.api.pubsub.emit('page', env);
                }
            });
        } else {
            done(false);
        }
    };

    /**
     * creates a new group from a blank template
     *
     * @param  {[params]}   params [group creation parameters]
     * @param  {Function}   done   [continuation function]
     */
    Group.createFromScratch = function (params, done) {
        params.modules = params.modules || [
            { name: 'user', contract: { google: true, local: true }},
            { name: 'admin'},
            { name: 'core'},
            { name: 'stylesheet' },
            { name: 'core-widgets' },
            { name: 'content' }
        ];
        Page.findOne({where: {url: params.url}}, function (err, p) {
            if (p) return done(new Error('Group exists'));
            Group.create(params, function (e, g) {
                if (e) return done(e);
                g.pages.create({
                    url: params.url,
                    title: params.name
                }, function (err, page) {
                    g.homepage = page.toMinimalObject();
                    g.save(function (err, g) {
                        Page.updateGroup(g.id);
                        addAdminUser(g.id, params.url.split('/')[0]);
                        setTimeout(done.bind(null, err, g), 500);
                    });
                });
            });
        });

        function addAdminUser(groupId, host) {
            User.create({
                email: 'admin@' + host,
                username: 'admin-' + host,
                password: 'secr3t',
                membership: [{groupId: groupId, role: 'owner', state: 'approved'}]
            }, function (err, user) {
            });
        }
    };

    /**
     * Update the URL for this group.
     *
     * @param  {String} url - new URL
     */
    Group.prototype.updateUrl = function(url, next) {
        var group = this;
        var oldUrl = group.homepage.url;

        if (oldUrl.indexOf('/') === oldUrl.length) {
            oldUrl = oldUrl.substring(0, oldUrl.length -1);
        }

        //fix the url
        if(url.indexOf('http') > -1) url = url.substring(url.indexOf('//') + 2);

        //validate the new url
        Page.all({ where: { url: url }}, function(err, pages) {
            if(pages.length > 0) return next(new Error('Sorry, the URL "' + url + '" is being used by another group.'));

            //get the pages for the group
            Page.all({ where: { groupId: group.id }}, function(err, pages) {
                //loop through each page and update the url for each
                async.forEach(pages, function(page, next) {
                    console.log('replace ' + oldUrl + ' with ' + url + ' for: ' + page.url);

                    page.url = page.url.replace(oldUrl, url);
                    page.url = page.url.replace('//', '/');

                    if (page.url.lastIndexOf('/') === page.url.length) {
                        page.url = page.url.substring(0, page.url.length - 1);
                    }

                    console.log('new url = ' + page.url);

                    page.save(next);
                }), function(err, results) {
                    Page.updateGroup(group.id, function() {
                        return next(err);
                    });
                };
            });
        });
    };

    /**
     * Get the specified module for this group.
     *
     * @param  {String} name - module name
     * @return {Module}      - module
     */
    Group.prototype.getModule = function(name) {
        var module = this.modules.find(name, 'name');
        return module;
    };

    /**
     * Save a custom profile field for this group.
     *
     * @param  {Object}   field    - custom profile field object
     * @param  {Function} callback - callback function
     */
    Group.prototype.saveCustomProfileField = function (field, callback) {
        if (field.id) {
            this.customProfileFields.remove(this.customProfileFields.find(field.id, 'id'));
        }

        this.customProfileFields.push(field);
        this.save(callback);
    };

    /**
     * Remove a custom profile field from this group.
     *
     * @param  {Number}   fieldId  - id of the field to remove
     * @param  {Function} callback - callback function
     */
    Group.prototype.removeCustomProfileField = function (fieldId, callback) {
        this.customProfileFields.remove(this.customProfileFields.find(fieldId, 'id'));
        this.save(callback);
    };
};

