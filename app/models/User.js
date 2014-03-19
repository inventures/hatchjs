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

var mailer = require('nodemailer');
var async = require('async');
var _ = require('underscore');
var moment = require('moment');
var crypto = require('crypto');

module.exports = function (compound, User) {
    var unsafeChars = /[^-_\.a-z0-9A-Z]+/g;
    var Group = compound.models.Group;

    User.validatesPresenceOf('username', {message: 'Please enter a username'});
    User.validatesPresenceOf('email', {message: 'Please enter an email address'});
    User.validatesPresenceOf('password', {message: 'Please enter a password'});
    User.validatesLengthOf('origPassword', {min: 6, allowNull: true});
    User.validatesFormatOf('username', {with: /^[-_\.a-z0-9]+$/i, message: 'Username only can contain latin letters, digits, and -_. characters', allowBlank: true});
    User.validatesFormatOf('email', {with: /^([^@\s]+)@((?:[-a-z0-9]+\.)+[a-z]{2,})$/i, message: 'Invalid email address', allowBlank: true});
    User.validatesUniquenessOf('email', {message: 'This email address is taken'});
    User.validatesUniquenessOf('username', {message: 'This username is taken'});

    // defines the possible sort orders for users
    User.tagSortOrders = [
        { name: 'ID', value: 'id DESC' },
        { name: 'Username', value: 'username ASC' },
        { name: 'Last name', value: 'lastname ASC' },
        { name: 'First name', value: 'firstname ASC' },
        { name: 'Date registered', value: 'createdAt DESC' }
    ];

    /**
     * Get the first letter of the last name for this user.
     *
     * @return {String}
     */
    User.getter.lastnameLetter = function () {
        return (this.lastname && this.lastname[0] || '').toLowerCase();
    };

    /**
     * get the tag names as a single string for this user
     *
     * @return {String} - concatenated tag names
     */
    User.getter.tagNames = function () {
        return this.tags.pluck('title').join(', ');
    };

    /**
     * Get the best display name for this user. Prefers firstname + lastname but
     * falls back to username.
     *
     * @return {String}
     */
    User.getter.displayName = function() {
        return (this.firstname && this.lastname) ?
            (this.firstname + ' ' + this.lastname) : this.username;
    };

    // Builds group index by membership state
    function getMembershipIndex (user, value, identifier) {
        if (!identifier) {
            identifier = 'groupId';
        }
        var index = [];
        user.memberships.forEach(function (membership) {
            if(!value || membership.state === value || membership.role === value) {
                index.push(membership[identifier]);
            }
        });
        return index;
    }

    /**
     * Get an array of ids for all groups this user is a member of with any
     * state/role (member, pending, editor).
     *
     * @return {Array} - an array of group ids
     */
    User.getter.membershipGroupId = function() {
        return getMembershipIndex(this);
    };

    /**
     * Get an array of ids for all groups this user is a member of with role
     * of 'member'.
     *
     * @return {Array} - an array of group ids
     */
    User.getter.memberGroupId = function() {
        return getMembershipIndex(this, 'member');
    };

    /**
     * Get an array of ids for all groups this user is a member of with state
     * of 'pending'.
     *
     * @return {Array} - an array of group ids
     */
    User.getter.pendingGroupId = function() {
        return getMembershipIndex(this, 'pending');
    };

    /**
     * Get an array of ids for all groups this user is a member of with role
     * of 'editor'.
     *
     * @return {Array} - an array of group ids
     */
    User.getter.editorGroupId = function() {
        return getMembershipIndex(this, 'editor');
    };

    /**
     * Get an array of invitation codes for all groups this user is a pending
     * to become a member of.
     *
     * @return {Array} - an array of invitation codes
     */
    User.getter.inviteGroupId = function() {
        return getMembershipIndex(this, 'pending', 'invitationCode');
    };

    /**
     * Get an array of ids for all groups this user is a member of with state
     * of 'blacklisted'.
     *
     * @return {Array} - an array of group ids
     */
    User.getter.blacklistedGroupId = function() {
        return getMembershipIndex(this, 'blacklisted');
    };

    /**
     * Get the text for the fulltext index for this user.
     *
     * @return {String} - username+firstname+lastname+oneLiner
     */
    User.getter.fulltext = function() {
        return
        [
            this.username,
            this.firstname,
            this.lastname,
            this.oneLiner
        ].join(' ');
    };

    /**
     * Performs functions before a user is saved to the database.
     * - fixes username and email
     * - set the default profile pic
     *
     * @param  {Function} next - continuation function
     */
    User.beforeCreate = User.beforeSave = function (next, data) {
        // lowercase username and email
        if (data.email) {
            data.email = data.email.toLowerCase();
        }
        if (data.username) {
            data.username = data.username.toLowerCase();
        }

        // set the default profile pic
        if (!this.avatar) {
            this.avatar = '/img/default-profile-pic.png';
        }

        next();
    };

    /**
     * Find a user by their username/email address.
     *
     * @param  {String}   username - username or email address
     * @param  {Function} callback - callback function
     */
    User.findByUsername = function (username, callback) {
        var cond = {};

        if (username.indexOf('@') > -1) {
            cond.email = username;
        } else {
            cond.username = username;
        }

        User.findOne({ where: cond }, callback);
    };

    /**
     * Notify this user by either email, top bar notification or both.
     *
     * @param  {String}     type     - the name of the notification to send
     * @param  {Object}     params   - notification parameters
     * @param  {Function}   callback - continuation function
     */
    User.prototype.notify = function (type, params, callback) {
        var user = this;
        params = params || {};

        //ignore this email if the user doesn't accept this mail type
        if(!this.canReceiveEmail(type)) {
            console.log(this.username + ' refuses email notification: ' + type);
            return;
        }

        //make sure user is part of the parameters
        if (!params.user) params.user = user;

        //send a notification email and create a notification at the same time
        async.parallel([
            function (done) {
                if (!compound.structure.views['mail/user/' + type + '.html']) {
                    return done()
                }

                try {
                    compound.mailer.send('user/' + type, user, compound, params);
                } catch (e) {
                    return done(e);
                }

                done();
            },
            function(done) {
                if (compound.hatch.notification.isDefined(type)) {
                    console.log('create hatch notification', type);
                    compound.hatch.notification.create(type, user, params || [], done);
                } else {
                    console.log('hatch notification', type, 'is not defined');
                    done();
                }
            }
        ], function (err, results) {
            if (callback) {
                callback();
            }
        })
    };

    /**
     * Follow the specified user.id
     *
     * @param  {Number}   id       - id of user to follow
     * @param  {Function} callback - continuation function
     */
    User.prototype.followUser = function (id, callback) {
        var user = this;
        var hq = User.schema.adapter;
        var redis = User.schema.adapter.client;

        redis.sadd('l:' + hq.modelName('Follow') + ':' + id, this.id, function (err) {
            if (err) {
                return callback(err);
            }
            user.following = user.following || [];
            user.following.push(id);
            user.save(callback);
        });
    };

    /**
     * Unfollow the specified user.id
     *
     * @param  {Number}   id       - id of user to unfollow
     * @param  {Function} callback - continuation function
     */
    User.prototype.unfollowUser = function (id, callback) {
        var user = this;
        var hq = User.schema.adapter;
        var redis = User.schema.adapter.client;

        redis.srem('l:' + hq.modelName('Follow') + ':' + id, this.id, function (err) {
            if (err) {
                return callback(err);
            }
            user.following = user.following || [];
            user.following = _.reject(user.following, function(userId) {
                return userId == id;
            });
            user.save(callback);
        });
    };

    /**
     * Get the followers of the specified user.
     *
     * @param  {Number}     userId   - id of the user to get followers for
     * @param  {Function}   callback - continuation function
     */
    User.getFollowersOf = function (userId, callback) {
        var hq = User.schema.adapter;
        var redis = User.schema.adapter.client;

        redis.smembers('l:' + hq.modelName('Follow') + ':' + userId, callback);
    };

    /**
     * Get the followers for this user.
     *
     * @param  {Function} callback - continuation function
     */
    User.prototype.followers = function (callback) {
        var hq = User.schema.adapter;
        var redis = User.schema.adapter.client;

        User.getFollowersOf(this.id, function (err, ids) {
            if (err) {
                return callback(err);
            }
            redis.multi(ids.map(function (id) {
                return ['GET', hq.modelName('User') + ':' + id];
            })).exec(function (err, resp) {
                if (err) return callback(err);
                callback(err, resp.map(function (r) {
                    return new User(JSON.parse(r));
                }));
            });
        });
    };

    /**
     * Authenticate a user. This either registers a new user or logs them in if
     * they already exist.
     *
     * @param  {String}      provider - facebook, twitter, linkedin etc
     * @param  {Object}      data     - data to auth/register with
     * @param  {HttpContext} c        - http context
     */
    User.authenticate = function (provider, data, c) {
        User.findOrCreate(provider, data, function (err, user) {
            if (user.errors) {
                throw Error(JSON.stringify(user.errors));
            }
            if (user) {
                c.req.session.userId = user.id;
            }
            if (user.email && user.password && user.type != 'temporary') {
                compound.hatch.hooks.hook(c, 'User.afterLogin', { user: user }, function() {
                    c.redirect(c.session.redirect || ('//' + c.req.group.url));
                });
            } else {
                //set user type to temporary and complete the registration
                user.type = 'temporary';

                user.save(function() {
                    compound.hatch.hooks.hook(c, 'User.afterRegister', { user: user }, function() {
                        c.redirect(c.specialPagePath('register') + '?redirect=' + escape(c.pathFor('user').join()));
                    });
                });
            }
        });
    };

    /**
     * Find one user by the full where clause or either property of the where clause.
     *
     * @param  {Object}   cond     - where clause condition
     * @param  {Function} callback - callback function
     */
    User.findOneEither = function (cond, callback) {
        if (cond.where) {
            cond = cond.where;
        }
        User.findOne({ where: cond }, function (err, user) {
            if (!user) {
                async.forEach(Object.keys(cond), function (key, done) {
                    where = {};
                    where[key] = cond[key];

                    User.findOne({ where: where }, function (err, u) {
                        if (!user && u) {
                            user = u;
                        }

                        done();
                    });
                }, function (err) {
                    callback(err, user);
                })
            } else {
                callback(err, user);
            }
        })
    };

    /**
     * Find a user if it already exists, otherwise create a new user with the
     * data.
     *
     * @param  {Object}   provider - provider of the data
     * @param  {Object}   data     - user data
     * @param  {Function} callback - continuation function
     */
    User.findOrCreate = function (provider, data, callback) {
        if (typeof provider.idFields !== 'object') {
            provider.idFields = [provider.idFields];
        }
        var cond = {};

        // build the query to check for an existing user
        provider.idFields.forEach(function (field) {
            cond[field] = data[field];
        });

        console.log('Authenticate user with:');
        console.log(cond);

        User.findOneEither({ where: cond }, function (err, user) {
            if (user) {
                // don't allow it to update username or email
                delete data.username;
                delete data.email;

                // don't update the user avatar if they already have one which
                // isn't the default avatar
                if (user.avatar && user.avatar !== '/img/default-profile-pic.png') {
                    delete data.avatar;
                }

                // update user details and return
                user.updateAttributes(data, callback);
            } else {
                // standard users (non-oauth)
                if (provider.name === 'local') {
                    User.create(data, callback);
                } else {
                    // fill in blank fields if not present
                    if (!data.email) {
                        data.email = 'temp_' + new Date().getTime() + '@temp.com';
                    }
                    if (!data.password) {
                        data.password = 'tempuser';
                    }

                    // register as a temporary user so they have to complete the
                    // rest of their profile
                    data.type = 'temporary';

                    // create the user with a unique username - this can add 1,2
                    // etc to the end of their username if it is already taken
                    User.createWithUniqueUsername(data, callback);
                }
            }
        });
    };

    /**
     * Create a user with a unique username - automatically appends 1,2,etc to
     * the end of username until it finds one which is free.
     *
     * @param  {Object}   data - user creation data
     * @param  {Function} done - continuation function
     * @param  {Number}   num  - leave this blank
     */
    User.createWithUniqueUsername = function (data, done, num) {
        var username;
        if (!num) num = 0;
        if (!num) {
            username = data.username;
        } else if (num < 50) {
            username = data.username + num;
        } else {
            username = data.username + Math.random();
        }
        if (username) {
            username = username.replace(unsafeChars, '.').toLowerCase();
        }
        User.findOne({
            where: {
                username: username
            }
        }, function (err, u) {
            if (!u) {
                data.username = username;
                data.membership = [];

                User.create(data, done);
            } else {
                User.createWithUniqueUsername(data, done, num + 1);
            }
        });
    };

    /**
     * Merge 2 user accounts into 1.
     *
     * @param  {Object}   data     - first user
     * @param  {Object}   newUser  - second user
     * @param  {Function} callback - continuation function
     */
    User.mergeAccounts = function (data, newUser, callback) {
        console.log('merging accounts');
        User.findOne({where: { email: data.email }}, function (err, user) {
            if (user && User.verifyPassword(data.password, user.password)) {
                console.log('user to merge with', user);
                Object.keys(newUser).forEach(function (field) {
                    if (field.match(/Id$/)) {
                        user[field] = user[field] || newUser[field];
                    }
                });
                user.save(function (err, user) {
                    if (newUser.id) {
                        console.log('removing new user');
                        newUser.destroy(done.bind(user, err, user));
                    } else {
                        callback(err, user);
                    }
                });
            } else {
                if (user) {
                    newUser.errors = {
                        email: ['already taken']
                    };
                    callback(new Error('Email already taken'), newUser);
                } else {
                    newUser.email = data.email;
                    newUser.save(callback);
                }
            }
        });
    };

    /**
     * Verify a user's password.
     *
     * @param  {String}   password     - password to check
     * @param  {String}   userPassword - password to check against
     * @return {Boolean}
     */
    User.verifyPassword = function (password, userPassword) {
        if (userPassword === null) return true;

        if (password && calcSha(password) === userPassword || password === userPassword) {
            return true;
        }
        return false;
    };

    /**
     * Set the user's password hash to store in the database.
     *
     * @param  {String} pwd - original password
     */
    User.setter.password = function (pwd) {
        this._password = calcSha(pwd);
    };

    /**
     * Validate that the user has entered all of the mandatory profile fields
     * for the specified group.
     *
     * @param  {Group}   group - group to check profile fields for
     * @return {Boolean}
     */
    User.prototype.validateGroupProfileFields = function(group) {
        var valid = true;
        var user = this;

        (group.profileFields || []).forEach(function(field) {
            if(field.mandatory && !(user.otherFields || [])[field.name]) valid = false;
        });

        return valid;
    };

    /**
     * Get a user who matches the specified invitation code.
     *
     * @param  {Number}   groupId        - id of the group
     * @param  {String}   invitationCode - invitation code hash to load invitation for
     * @param  {Function} callback       - continuation function
     */
    User.getByInvitationCode = function(groupId, invitationCode, callback) {
        var cond = {
            membershipGroupId: groupId,
            inviteGroupId: invitationCode
        };

        User.all({where: cond}, function(err, users) {
            callback(err, users[0]);
        })
    };

    /**
     * Send a reset password link to this user.
     *
     * @param  {HttpContext}   c        - http context
     * @param  {Function}      callback - callback function
     */
    User.prototype.resetPassword = function (c, callback) {
        var user = this;
        compound.models.ResetPassword.upgrade(this, function (err, rp) {
            user.notify('resetpassword', { token: rp.token, group: c.req.group });
            if (callback) {
                callback();
            }
        });
    };

    /**
     * Join the group `group`.
     *
     * @param {Group}    group    - group to join
     * @param {String}   code     - invitation code
     * @param {Function} callback - callback function
     */
    User.prototype.joinGroup = function(group, code, callback) {

        // default state
        var user = this;
        var state = 'pending';
        var requested = true;

        // check for existing membership
        var membership = _.find(this.memberships, function (membership) {
            return membership && membership.groupId == group.id;
        });

        // group:closed - do not join unless there is an invitation
        if (!membership) {
            // check for the invitation code
            if (code) {
                User.getByInvitationCode(group.id, code, function (err, u) {
                    if (err) {
                        return callback(err);
                    }
                    if (u && u.id != user.id && u.type === 'temporary') {
                        // delete the temp user
                        user.destroy();

                        // transfer the ownership of the invitation
                        state = 'accepted';
                        requested = false;
                    }
                });
            }

            // if we weren't able to find an invitation, cancel out
            if (state !== 'accepted' && group.joinPermissions === 'closed') {
                return callback();
            }
        }

        // group:free - automatically join
        if (group.joinPermissions === 'free') {
            state = 'accepted';
        }

        if (membership) {
            membership.state = state;

            if (membership.state === 'pending') {
                // if there is already an invite - approve
                if (!membership.requested) {
                    state = 'accepted';
                }
                // if there is already a request to join - do nothing
                else {
                    return callback();
                }
            }

            membership.state = state;
            membership.requested = requested;
            membership.joinedAt = new Date();
        } else {
            membership = {
                groupId: group.id,
                role: 'member',
                state: state,
                requested: requested,
                joinedAt: new Date()
            };

            this.memberships.push(membership);
        }

        // save and continue
        this.save(callback);
    };

    /**
     * Get the membership record for the specified group.
     *
     * @param  {Number} groupId - group.id
     * @return {Object}         - membership record or null
     */
    User.prototype.getMembership = function (groupId) {
        var membership = this.memberships.find(groupId, 'groupId');
        if (membership) {
            membership.timeSince = moment(membership.joinedAt).fromNow();
        }
        return membership;
    };

    /**
     * Set a user's membership role within the specified group.
     *
     * @param {Number}   groupId  - group.id
     * @param {String}   role     - role to set
     * @param {Function} callback - callback function
     */
    User.prototype.setMembershipRole = function (groupId, role, callback) {
        var membership = this.memberships.find(groupId, 'groupId');
        if (membership && membership.role !== 'owner') {
            membership.role = role;
        }
        this.save(callback);
    };

    /**
     * Set a user's membership state within the specified group.
     *
     * @param {Number}   groupId  - group.id
     * @param {String}   state    - state to set
     * @param {Function} callback - callback function
     */
    User.prototype.setMembershipState = function (groupId, state, callback) {
        var membership = this.memberships.find(groupId, 'groupId');
        // don't set the state for owner - their state cannot be changed
        if (membership && membership.role !== 'owner') {
            membership.state = state;
        }
        this.save(callback);
    };

    /**
     * Check whether user is eligible to manage group
     *
     * @param {Number} groupId - id of group
     */
    User.prototype.adminOf = function (groupId) {
        if (groupId instanceof Group) groupId = groupId.id;
        var m = this.getMembership(Number(groupId));
        if (m && (m.role === 'editor' || m.role === 'owner')) {
            return m;
        } else {
            return null;
        }
    };

    /**
     * Send an email invitation to this user for the specified group.
     *
     * @param  {Number}   groupId  - id of the group to invite to
     * @param  {String}   subject  - email subject
     * @param  {String}   body     - email body
     * @param  {Function} callback - callback function
     */
    User.prototype.invite = function (groupId, subject, body, callback) {
        // check for existing membership
        var membership = this.getMembership(groupId);

        if(membership && membership.requested) {
            this.acceptJoinRequest(groupId, callback);
        } else if (!membership) {
            var membership = {
                groupId: groupId,
                state: 'pending',
                role: 'member',
                createdAt: new Date(),
                joinedAt: new Date()
            };
            this.memberships.push(membership);
            this.save(function (err, user) {
                user.notify('invite', { groupId: groupId, subject: subject, body: body }, callback);
            });
        } else {
            // user is already a member or has already been invited - skip
            callback(null, this);
        }
    };

    /**
     * Accept a join request for the specified group.
     *
     * @param  {Number}   groupId  - id of the group to accept for
     * @param  {Function} callback - callback function
     */
    User.prototype.acceptJoinRequest = function (groupId, callback) {
        this.setMembershipState(groupId, 'accepted', function (err, user) {
            user.notify('joinRequestAccepted', { groupId: groupId }, callback);
        });
    };

    /**
     * Remove a membership to the specified group.
     *
     * @param  {Number}   groupId  - group.id
     * @param  {Function} callback - callback function
     */
    User.prototype.rejectInvitation = User.prototype.removeMembership = function (groupId, callback) {
        var user = this;

        user.memberships.items = _.reject(user.memberships.items, function (membership) {
            return membership.groupId == groupId;
        });

        // remove any tags for this group
        compound.models.Tag.all({ where: { groupId: groupId }}, function (err, tags) {
            var tagIds = _.pluck(tags, 'id');
            user.tags.items = _.reject(user.tags.items, function (tag) {
                return tagIds.indexOf(tag) > -1;
            });
            user.save(callback);
        });
    };

    /**
     * Output the publicObject representation of this user - automatically
     * removes sensitive information such as email address, password hash etc.
     *
     * @return {Object} - JSON representation of user
     */
    User.prototype.toPublicObject = function () {
        var obj = this.toObject();

        delete obj.password;
        delete obj.hasPassword;
        delete obj.email;
        delete obj.memberships;
        delete obj.following;
        delete obj.customListIds;
        delete obj.mailSettings;
        delete obj.fulltext;
        delete obj.type;
        delete obj.membershipGroupId;
        delete obj.memberGroupId;
        delete obj.pendingGroupId;
        delete obj.editorGroupId;
        delete obj.blacklistedGroupId;
        delete obj.inviteGroupId;

        return obj;
    };

    /**
     * Get whether this user accepts the specified type of email notification.
     *
     * @param  {String} type - type of notification
     * @return {Boolean}
     */
    User.prototype.canReceiveEmail = function(type) {
        var setting = (this.mailSettings || {})[type];

        if (!setting || setting == 'true') {
            return true;
        } else {
            return setting == true;
        }
    };

    /**
     * encrypts a password
     *
     * @param  {[string]} payload [password to encrypyt]
     * @return {[string]}         [encrypted password]
     */
    User.calcSha = function(payload) {
        return calcSha(payload);
    }

    /**
     * calculates a sha1 of the specified string
     *
     * @param  {[String]} payload
     * @return {[String]}
     */
    function calcSha(payload) {
        if (!payload) return '';
        if (payload.length == 64) return payload;
        return crypto.createHash('sha256').update(payload).update(compound.app.get('password salt') || '').digest('hex');
    }

    /**
     * Check whether this user has the specified permission.
     *
     * @param {Group}    group      - group to check within
     * @param {String}   permission - name of the permission to check for
     * @param {Function} callback   - callback function
     */
    User.prototype.hasPermission = function(group, permission, callback) {
        var user = this;
        var redis = User.schema.adapter.client;
        var hq = User.schema.adapter;

        var membership = _.find(this.memberships.items, function (membership) {
            return membership.groupId == group.id;
        });

        // non-members or not-accepted members - return false
        if(!membership || (membership.state !== 'accepted' && membership.state !== 'approved')) {
            return callback(null, false);
        }
        // special case for 'view' permission - only need to be a member
        else if(permission === 'view') {
            return callback(null, true);
        }

        // owner and editor can do everything
        if(membership.role === 'owner' || membership.role === 'editor') {
            return callback(null, true);
        }

        var found = false;

        // check permissions within tags for the specified group
        compound.models.Tag.all({ where: { groupIdByType: group.id + '-User' }}, function (err, tags) {
            tags.forEach(function (tag) {
                // look at permissions first to avoid needless calls
                if(!found && _.find(tag.permissions.items), function (tagPermission) {
                    return new Regexp(permission).exec(tagPermission);
                }) {
                    redis.zrank('z:' + hq.modelName('Tag') + ':' + tag.id, user.id, function (err, rank) {
                        if (rank) {
                            found = true;
                            return callback(null, found);
                        }
                    });
                }
            });
        });

        if (!found) {
            return callback(null, found);
        }
    };

    /**
     * Populate all of the memberships with full group info for the specified
     * list of users.
     *
     * @param  {Array}    users    - list of users
     * @param  {Function} callback - callback function
     */
    User.populateMemberships = function (users, callback) {
        var groupIds = [];
        var groupsHash = {};

        users.forEach(function (user) {
            user.memberships.forEach(function (membership) {
                if (groupIds.indexOf(membership.groupId) === -1) {
                    groupIds.push(membership.groupId.toString());
                }
            });
        });

        // if there are no memberships to populate, exit
        if (groupIds.length === 0) {
            return callback(null, users);
        }

        // load all of the matching groups
        Group.all({ where: { id: { inq: groupIds }}}, function (err, groups) {
            groups.forEach(function (err, index) { // WTF: this is weird
                var group = groups[index];
                if (group.id) {
                    groupsHash[group.id.toString()] = group;
                }
            });

            users.forEach(function (user) {
                user.memberships.forEach(function (membership) {
                    membership.group = groupsHash[membership.groupId.toString()];
                });
            });

            callback(err, users);
        });
    };
};
