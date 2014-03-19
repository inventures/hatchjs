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
var async = require('async');

// load the user tags for this group to display on the left navigation
function loadTags(c) {
    c.Tag.all({ where: { groupIdByType: c.req.group.id + '-User' }, limit: 5}, function (err, tags) {
        delete tags.countBeforeLimit;
        c.locals.tags = tags;
        c.next();
    });
}

// finds a specific member and sets their membership to this group
function findMember(c) {
    c.User.find(c.req.params.id, function (err, user) {
        c.locals.member = user;
        c.locals.membership = user.getMembership(c.req.group.id);
        c.next();
    });
}

/**
 * Instantiate a new users controller.
 */
function UsersController(init) {
    Application.call(this, init);
    init.before(findMember, {only: 'edit, update, destroy, resendInvite, accept, remove, upgrade, downgrade, resendInvite'});
    init.before(loadTags);
    init.before(setupFilterTabs);
}

module.exports = UsersController;

// inherit from the application controller
require('util').inherits(UsersController, Application);

/**
 * Setup the subtabs for the users controller.
 * 
 * @param  {HttpContext} c - context
 */
Application.installTabGroup('users', function(c) {
    var subTabs = [];
    
    subTabs.push({ header: 'users.headers.users' });

    subTabs.push({
        name: 'users.headers.list',
        url: c.req.params.filterBy && isNaN(c.req.params.filterBy) && c.pathTo.filteredUsers(c.req.params.filterBy) || 'community'
    });

    subTabs.push({ header: 'users.headers.tags' });
    subTabs.push({ name: 'tags.headers.manageTags', url: c.pathTo.tags('users') });

    c.locals.tags.forEach(function(tag) {
        if (tag.count > 0) {
            subTabs.push({
                name: tag.title,
                url: c.pathTo.filteredUsers(tag.id.toString()),
                count: tag.count
            });
        }
    });

    subTabs.push({ name: 'tags.actions.new', url: c.pathTo.newTag('users') });

    subTabs.push({ header: 'users.headers.actions' });

    // actions
    subTabs.push({ name: 'users.actions.invite', url: c.pathTo.inviteForm });
    subTabs.push({ name: 'users.actions.sendMessage', url: c.pathTo.sendMessageForm });
    subTabs.push({ name: 'users.actions.profileFields', url: c.pathTo.profileFields });
    subTabs.push({ name: 'users.actions.export', url: c.pathTo.export });

    return subTabs;
});

/**
 * Setup the filter tabs.
 * 
 * @param  {HttpContext} c - context
 * @return {[type]}   [description]
 */
function setupFilterTabs(c) {
    var filterTabs = [];

    filterTabs.push({
        name: 'users.headers.all',
        url: 'community'
    });

    c.locals.memberRoles.forEach(function (role) {
        filterTabs.push({
            name: 'users.headers.' + role.name,
            url: c.pathTo.filteredUsers(role.filter)
        });
    });

    c.locals.filterTabs = filterTabs;
    c.next();
}

// loads all/specified members based on the current context
function loadMembers(c, next) {
    var cond = { };

    c.locals.filterBy = c.req.params.filterBy || c.req.query.filterBy || c.req.body.filterBy || 'all';

    switch (c.locals.filterBy) {
        case 'member':
            cond.memberGroupId = c.req.group.id;
            break;
        case 'editor':
            cond.editorGroupId = c.req.group.id;
            break;
        case 'pending':
            cond.pendingGroupId = c.req.group.id;
            break;
        case 'blacklisted':
            cond.blacklistedGroupId = c.req.group.id;
            break;
        case 'all':
            cond.membershipGroupId = c.req.group.id;
            break;
        default:
            cond.tags = c.locals.filterBy;
            break;
    }

    var colNames = ['', 'username', 'tagNames', '', '', ''];

    var limit = parseInt(c.req.query.iDisplayLength || c.req.query.limit || 10, 10);
    var offset = parseInt(c.req.query.iDisplayStart || c.req.query.offset || 0, 10);
    var orderBy = c.req.query.iSortCol_0 > 0 ? (colNames[c.req.query.iSortCol_0] + ' ' + c.req.query.sSortDir_0.toUpperCase()) : 'username';
    var search = c.req.query.sSearch || c.req.body.search;
    var onlyKeys = c.req.query.onlyKeys;

    var query = {
        where: cond,
        fulltext: search,
        order: orderBy,
        offset: offset,
        limit: limit,
        onlyKeys: onlyKeys
    };

    // we need all the tags to only display those for the this group
    c.Tag.all({ where: { groupIdByType: c.req.group.id + '-User' }}, function (err, tags) {
        // first get the total count of all members and then run the
        c.User.count({ membershipGroupId: c.req.group.id }, function (err, count) {
            c.User.all(query, function (err, members) {

                if (!onlyKeys) {
                    setMemberships(members);
                }

                c.locals.members = members;
                c.locals.allMembersCount = count;

                next(err, members);
            });
        });

        function setMemberships(members) {
            members.forEach (function (member) {
                member.membership = member.getMembership(c.req.group.id);
                member.tags = member.tags.filter(function (tag) {
                    return _.find(tags, function (t) {
                        return t.id == tag.id;
                    });
                });
            });
        }
    });
}


/**
 * Display the main user list or loads the main user list in JSON format.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.index = function (c) {
    this.req.session.adminSection = 'community';
    var suffix = 'string' === typeof c.req.params.filterBy ? '-' + c.req.params.filterBy : '';
    this.pageName = 'users' + suffix;

    c.respondTo(function(format) {
        format.html(function() {
            c.locals.filterBy = c.req.params.filterBy || c.req.query.filterBy || c.req.body.filterBy || 'all';
            c.render();
        });
        format.json(function() {
            //load all members and display
            loadMembers(c, function() {
                //json response
                c.send({
                    sEcho: c.req.query.sEcho || 1,
                    iTotalRecords: c.locals.allMembersCount,
                    iTotalDisplayRecords: c.locals.members.countBeforeLimit || 0,
                    aaData: c.locals.members
                });
            });
        });
    });
};

/**
 * Return only the IDs for a search query. This is used when a user clicks the
 * 'select all' checkbox so that we can get ALL of the ids of the users rather
 * than just the ids of the users on the current page of results.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.ids = function ids(c) {
    this.filterBy = c.req.query.filterBy || c.req.params.filterBy;

    // make sure we get all users
    c.req.query.limit = 1000000;
    c.req.query.onlyKeys = true;

    loadMembers(c, function(err, members) {
        c.send({
            ids: members
        });
    });
};


/**
 * Remove the specified user from the community.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.remove = function(c) {
    this.member.removeMembership(c.req.group.id, function (err) {
        if (err) {
            return c.sendError(err);
        }

        c.send('ok');
    });
};


/**
 * Destroy the specified user.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.destroy = function(c) {
    this.member.destroy(function (err) {
        if (err) {
            return c.error({
                status: 'error',
                message: 'Failed to delete user.'
            });
        }

        c.send('ok');
    });
};

/**
 * Remove multiple selected members from the community.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.removeMembers = function(c) {
    var selectedUsers = c.req.body.ids || [];
    var count = 0;

    //remove each of the members
    async.forEach(selectedUsers, function(userId, done) {
        //load each user
        c.User.find(userId, function (err, user) {
            user.removeMembership(c.req.group.id, done);
            count++;
        });
    }, function() {
        c.send({
            message: c.t(['users.help.removed', count]),
            status: 'success',
            icon: 'ok'
        });
    });
};

/**
 * Black-list multiple selected members from the community.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.blacklistMembers = function(c) {
    var selectedUsers = c.req.body.ids || [];
    var count = 0;

    //blacklist each of the members
    async.forEach(selectedUsers, function(userId, done) {
        c.User.find(userId, function (err, user) {
            user.setMembershipState(c.req.group.id, 'blacklisted', done);
            count++;
        });
    }, function() {
        c.send({
            message: c.t(['users.help.blacklisted', count]),
            status: 'success',
            icon: 'ok'
        });
    });
};

/**
 * Un-black-list multiple selected members from the community.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.unblacklistMembers = function(c) {
    var selectedUsers = c.req.body.ids || [];
    var count = 0;

    //un-blacklist each of the members
    async.forEach(selectedUsers, function(userId, done) {
        c.User.find(userId, function (err, user) {
            user.setMembershipState(c.req.group.id, 'accepted', done);
            count++;
        });
    }, function() {
        c.send({
            message: c.t(['users.help.unblacklisted', count]),
            status: 'success',
            icon: 'ok'
        });
    });
};


/**
 * Upgrade the selected member to an editor.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.upgrade = function(c) {
    this.member.setMembershipRole(c.req.group.id, 'editor', function (err) {
        if (err) {
            return c.sendError(err);
        }

        c.send('ok');
    });
};

/**
 * Downgrade the selected editor to a member.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.downgrade = function(c) {
    this.member.setMembershipRole(c.req.group.id, 'member', function (err) {
        if (err) {
            return c.sendError(err);
        }

        c.send('ok');
    });
};

/**
 * Accept the selected pending member's join request.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.accept = function(c) {
    this.member.setMembershipState(c.req.group.id, 'accepted', function (err) {
        if (err) {
            return c.sendError(err);
        }

        c.send('ok');
    });
};

/**
 * Resend an invitation to the selected member.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.resendInvite = function(c) {
    var membership = this.member.getMembership(c.req.group.id);
    this.member.notify('invite', _.extend({ invitationCode: membership.invitationCode }, c));
    c.send('ok');
};

/**
 * Redirect to the send message form for the selected members (or entire community).
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.sendMessageTo = function(c) {
    //set the selectedUsers in the session so that it can be used after the redirect
    c.req.session.selectedUsers = c.req.body.ids || [];

    c.send({
        redirect: c.pathTo.sendMessage()
    });
};

/**
 * Show the send message form for the selected members (or entire community).
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.sendMessageForm = function(c) {
    c.locals.selectedUsers = c.req.session.selectedUsers || [];
    delete c.req.session.selectedUsers;
    c.render();
};

/**
 * Send a message to selected members.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.sendMessage = function(c) {
    var selectedUsers = JSON.parse(c.req.body.selectedUsers);
    var subject = c.req.body.subject;
    var body = c.req.body.body;

    // validation
    if (!subject || !body) {
        return c.send({
            message: c.t('users.validation.sendMessage'),
            status: 'error',
            icon: 'warning-sign'
        });
    }

    var cond = { membershipGroupId: c.req.group.id };

    if (selectedUsers.length > 0) {
        cond = { id: { inq: selectedUsers }};
    }

    //sends message to each selected user
    c.User.iterate({ batchSize: 500, where: cond }, function (user, next) {
        //send the message via email
        user.notify('message', {groupId: c.req.group.id, subject: subject, message: body });
        next();
    }, function (err) {
        if (err) {
            return c.sendError(err);
        }

        c.send({
            message: c.t(['users.help.messageSent', selectedUsers.length || 'all']),
            status: 'success',
            icon: 'ok'
        });
    });
};

/**
 * Show the invite form.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.inviteForm = function(c) {
    c.render();
};

/**
 * Send invitations to the specified usernames/email addresses.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.sendInvites = function(c) {
    var subject = c.req.body.subject;
    var body = c.req.body.body;

    //validation
    if(!c.req.body.usernames) {
        return c.send({
            message: c.t('users.validation.invite'),
            status: 'error',
            icon: 'warning-sign'
        });
    }
    if(!subject || !body) {
        return c.send({
            message: c.t('users.validation.sendMessage'),
            status: 'error',
            icon: 'warning-sign'
        });
    }

    // loop through each username and wait for completion
    async.forEach(c.body.usernames, function(username, next) {
        // find or create each user from scratch
        var data = {
            type: 'temporary',
            username: username.split('@')[0],
            email: username,
            password: 'temporary'
        };

        var provider = {
            name: 'local',
            idFields: ['username']
        };

        c.User.findOrCreate(provider, data, function(err, user) {
            if (err) {
                next(err);
            }
            user.invite(c.req.group.id, subject, body, next);
        });
    }, done);

    function done(err) {
        if (err) {
            return c.sendError(err);
        }

        c.send({
            message: c.t(['users.help.inviteSent', c.body.usernames.length]),
            status: 'success',
            icon: 'ok'
        });
    }
};

/**
 * Show the custom profile fields form.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.profileFields = function(c) {
    c.locals.profileFields = _.sortBy(c.req.group.customProfileFields.items, function (field) {
        return field && field.order || 0;
    });
    c.render();
};

/**
 * Show the edit form for the specified custom profile field.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.newProfileField = UsersController.prototype.editProfileField = function(c) {
    var field = c.req.group.customProfileFields.find(c.req.params.id, 'id');
    if(!field) field = {};

    c.locals.field = field;
    c.render('editProfileField');
};

/**
 * Save a custom profile field to the current group.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.saveProfileField = function(c) {
    //field name
    c.req.body.name = c.req.body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    //validation
    if(!c.req.body.name) {
        return c.sendError({
            message: c.t('users.validation.fieldName')
        });
    }

    c.req.group.saveCustomProfileField(c.req.body, function (err) {
        if (err) {
            return c.sendError(err);
        }

        c.flash('info', c.t('users.help.fieldSaved'));
        c.redirect(c.pathTo.profileFields());
    });
};

/**
 * Re-order the custom profile fields within this group.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.reorderProfileFields = function(c) {
    var order = 0;

    c.body.ids.forEach(function(id) {
        c.req.group.customProfileFields.find(id, 'id').order = order++;
    });

    c.req.group.save(function() {
        c.send({
            message: c.t('users.help.fieldOrderSaved'),
            status: 'success',
            icon: 'ok'
        });
    });
};

/**
 * Delete a custom profile field.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.deleteProfileField = function(c) {
    c.req.group.removeCustomProfileField(c.req.params.id, function () {
        c.send('ok');
    });
};

/**
 * Show the data export form.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.exportForm = function(c) {
    c.render();
};

/**
 * Export the entire member list as JSON or CSV.
 *
 * @param  {HttpContext} c - http context
 */
UsersController.prototype.export = function(c) {
    var format = c.req.body.format;
    var filename = 'users-' + (new Date().getTime()) + '.' + format;

    c.compound.hatch.exportData[format](c.User, { where: { memberGroupId: c.req.group.id }}, function (err, data) {
        c.res.setHeader('Content-disposition', 'attachment; filename=' + filename);
        c.res.setHeader('Content-Type', 'text/' + format);
        c.send(data);
    });
};

