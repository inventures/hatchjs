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

var Application = require('./application');
var _ = require('underscore');

module.exports = TagController;

function TagController(init) {
    Application.call(this, init);
    init.before(loadTags);
    init.before(findTag, {only: 'new,edit,update,destroy,add,remove'});
}

// gets the name of the active model
function getModelName(path) {
    var hash = {
        users: 'User',
        content: 'Content'
    };
    return hash[path];
}

// loads the tags for the active model
function loadTags(c) {
    c.locals.type = c.locals.sectionName = c.params.section;
    c.locals.modelName = getModelName(c.locals.sectionName);
    c.locals.pageName = c.actionName + '-tags';

    c.Tag.all({ where: { groupIdByType: c.req.group.id + '-' + c.locals.modelName }}, function (err, tags) {
        tags.forEach(function (tag) {
            tag.sortOrder = tag.sortOrder &&
            _.find(getSortOrders(c, c.params.section), function (sortOrder) {
                return sortOrder.value === tag.sortOrder;
            }).name;
        });

        c.locals.tags = tags;
        c.next();
    });
}

// find the tag to edit
function findTag (c) {
    var id = c.req.params.id || c.req.query.id || c.req.body.id;

    if (id) {
        c.Tag.find(id, function (err, tag) {
            c.locals.theTag = c.locals.theTag = tag;
            c.next();
        });
    } else {
        c.locals.theTag = c.locals.theTag = {};
        c.next();
    }
}

// gets the sort orders for the active model
function getSortOrders (c, type) {
    switch(type) {
        case 'content':
            return c.Content.tagSortOrders;

        case 'users':
            return c.User.tagSortOrders;
    }
}

/**
 * Show the full list of tags within this section.
 *
 * @param  {HttpContext} c - http context
 */
TagController.prototype.index = function (c) {
    c.locals.sortOrders = getSortOrders(c, this.type);
    c.render();
};

/**
 * Render the tag counts for this section.
 *
 * @param  {HttpContext} c - http context
 */
TagController.prototype.tagCounts = function (c) {
    c.send({
        tags: c.locals.tags
    });
};

/**
 * Show the new/edit form for the specified tag.
 *
 * @param  {HttpContext} c - http context
 */
TagController.prototype.edit = TagController.prototype.new = function (c) {
    var self = this;
    this.defaultFilter = 'return function(obj, callback) {\n\treturn false; ' +
        '//add your filter criteria here\n};';

    // create the recursive renderPermissions function
    c.locals.renderPermissions = function(permission) {
        var tag = self.theTag;
        var html = '<li><label class=""><input type="checkbox" name="permission-' +
            permission.name + '" ' +
            (tag.permissions && tag.permissions.find(permission.name, 'id') ? 'checked="checked"':'') +
            ' /> ' + permission.title + '</label>';

        if((permission.permissions || []).length > 0) {
            html += '<ul class="list-unstyled" style="margin-left: 20px;">';
            permission.permissions.forEach(function(permission) {
                html += c.locals.renderPermissions(permission);
            });
            html += '</ul>';
        }

        html += '</li>';
        return html;
    };

    c.locals.permissions = c.compound.hatch.permissions;
    c.locals.sortOrders = getSortOrders(c, this.type);
    c.locals.app = c.compound;
    c.render();
};

/**
 * Save changes to a tag.
 *
 * @param  {HttpContext} c - http context
 */
TagController.prototype.update = TagController.prototype.create = function (c) {
    var self = this;

    c.body.groupId = c.req.group.id;
    c.body.type = this.modelName;
    c.body.filter = c.body.filterEnabled && c.body.filter;

    // fix the permissions in req.body
    c.body.permissions = [];

    Object.keys(c.req.body).forEach(function(key) {
        if(key.indexOf('permission-') === 0) {
            c.body.permissions.push(key.substring(key.indexOf('-') +1));
        }
    });

    if (self.theTag && self.theTag.id) {
        self.theTag.updateAttributes(c.req.body, done);
    } else {
        c.Tag.create(c.req.body, done);
    }

    function done (err, tag) {
        if (err) {
            err.tag = tag;
            return c.sendError(err);
        }

        if (c.body.filterExisting) {
            // TODO: filter existing objects
        }

        c.flash('info', c.t('models.Tag.messages.saved'));
        c.send({
            redirect: c.pathTo.tags(self.sectionName)
        });
    }
};

/**
 * Delete a tag from the database.
 *
 * @param  {HttpContext} c - http context
 */
TagController.prototype.destroy = function (c) {
    this.theTag.destroy(function (err) {
        if (err) {
            return c.sendError(err);
        }

        c.flash('info', c.t('models.Tag.messages.deleted'));
        c.send({
            status: 'success',
            redirect: c.pathTo.tags(c.locals.type)
        });
    });
};

/**
 * Add one or more objects to a tag collection.
 *
 * @param {HttpContext} c - http context
 */
TagController.prototype.add = function (c) {
    var self = this;
    var model = c[this.modelName];

    model.iterate({ batchSize: 500, where: { id: { inq: c.req.body.ids }}}, function (obj, next) {
        self.theTag.add(obj, function (err) {
            if (err) {
                return c.sendError(err);
            }
            obj.save(next);
        });
    }, function () {
        c.send({
            status: 'success',
            message: c.t('models.Tag.messages.added')
        });
    });
};

/**
 * Remove one or more objects from a tag collection.
 *
 * @param  {HttpContext} c - http context
 */
TagController.prototype.remove = function (c) {
    var self = this;
    var model = c[this.modelName];

    model.iterate({ batchSize: 500, where: { id: { inq: c.req.body.ids }}}, function (obj, next) {
        self.theTag.remove(obj, function (err) {
            if (err) {
                return c.sendError(err);
            }
            
            obj.save(next);
        });
    }, function () {
        c.send({
            status: 'success',
            message: c.t('models.Tag.messages.removed')
        });
    });
};
