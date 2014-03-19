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

module.exports = function (compound, Content) {
    'use strict';

    var User = compound.models.User;
    var Page = compound.models.Page;
    var Comment = compound.models.Comment;
    var Like = compound.models.Like;
    var Media = compound.models.Media;
    var Tag = compound.models.Tag;

    var Group = compound.models.Group;
    var redis = Content.schema.adapter;
    var _ = require('underscore');
    var moment = require('moment');
    var chrono = require('chrono-node');
    var async = require('async');

    // determines the number of comments/likes which are cached with each content item
    Content.CACHEDCOMMENTS = 3;
    Content.CACHEDLIKES = 3;

    Content.validatesPresenceOf('createdAt', 'text', { message: 'Please enter some text' });

    // register the functions which can be called from the REST api
    Content.allowedApiActions = ['like', 'getLike', 'vote', 'postComment', 'flag', 'clearFlags', 'destroyAndBan', 'registerView'];

    // standard list of tag sort orders
    Content.tagSortOrders = [
        { name: 'ID', value: 'id DESC' },
        { name: 'Date', value: 'createdAt DESC' },
        { name: 'Popularity', value: 'score DESC' },
        { name: 'Comments', value: 'commentsTotal DESC' },
        { name: 'Likes', value: 'likesTotal DESC' }
    ];

    /**
     * gets the popularity score for this content
     *
     * @return {Number}
     */
    Content.getter.score = function () {
        return Math.min(Math.floor((this.likesTotal + this.commentsTotal) / 2), 5);
    };

    /**
     * gets the time since this post was published
     *
     * @return {String}
     */
    Content.getter.timeSince = function () {
        return moment(this.createdAt || new Date()).fromNow();
    };

    /**
     * sets the date for this post with high level of flexibility.
     */
    Content.setter.createdAt = function (value) {
        value = value || '';
        if (value && value.toString().match(/now|immediately/i)) {
            this._createdAt = new Date();
        } else {
            this._createdAt = new Date(value);
            if (isNaN(this._createdAt.valueOf())) {
                this._createdAt = chrono.parseDate(value);
            }
        }
    };

    /**
     * Get the first attachment of the specified type.
     * 
     * @param  {String} type - attachment type
     * @return {Media}
     */
    Content.prototype.getAttachment = function (type) {
        return _.find(this.attachments, function (media) {
            return media.type === type;
        });
    };

    /**
     * Get whether this content has been flagged.
     *
     * @return {Boolean}
     */
    Content.getter.hasFlag = function () {
        return this.flags.length > 0;
    };

    /**
     * gets the timestamp for this content
     *
     * @return {[Number]}
     */
    Content.getter.timestamp = function () {
        if (!this.createdAt || typeof this.createdAt === 'string' || !this.createdAt.getTime) {
            return 0;
        } else {
            return this.createdAt.getTime();
        }
    };

    /**
     * gets the text for the fulltext index
     *
     * @return {[String]}
     */
    Content.getter.fulltext = function () {
        return [
            this.title,
            this.text,
            JSON.stringify(this.tags)
        ].join(' ');
    };

    /**
     * get the tag names as a single string for this post
     *
     * @return {String} - concatenated tag names
     */
    Content.getter.tagNames = function () {
        if (this.tags.length === 0) {
            return '';
        } else {
            return this.tags.pluck('title').join(', ');
        }
    };

    /**
     * Before content is saved, make sure all automatic tag filters are applied
     *
     * @param  {Function} done [continuation function]
     */
    Content.beforeSave = function (done, data) {
        if (!data.createdAt) {
            data.createdAt = new Date();
        }

        data.updatedAt = new Date();

        // fix the attachments
        if (data.attachments) {
            data.attachments = data.attachments.map(function (media) {
                if (typeof media === 'string') {
                    return JSON.parse(media);
                } else {
                    return media;
                }
            });
        }

        if (data.previewImage && typeof data.previewImage === 'string' && data.previewImage.indexOf('{') === 0) {
            data.previewImage = JSON.parse(data.previewImage);
        }

        // set the author
        User.find(data.authorId, function (err, user) {
            data.author = user.toPublicObject();

            // get the group and check all tag filters
            Group.find(data.groupId, function (err, group) {
                if (!group) {
                    return done();
                }

                Tag.applyMatchingTags(data, function (err, data) {
                    //generate url
                    Content.generateUrl(data, group, done);
                });
            });
        });
    };

    /**
     * creates the url for this content if it is not already set
     *
     * @param  {Object}   data
     * @param  {[Group]}  group
     * @param  {Function} done  [continuation function]
     */
    Content.generateUrl = function (data, group, done) {
        if (!data.url) {
            var slug = slugify(data.title || new Date(data.createdAt || new Date(0)).getTime().toString());
            data.url = (group.homepage.url + '/' + slug).replace('//', '/');

            //check for duplicate pages and content in parallel
            async.parallel([
                function (callback) {
                    Content.all({where: { url: data.url}}, function (err, posts) {
                        callback(null, posts);
                    });
                },
                function (callback) {
                    Page.all({where: { url: data.url}}, function (err, pages) {
                        callback(null, pages);
                    });
                }
            ], function (err, results) {
                if (results[0].length > 0 || results[1].length > 0) {
                    data.url += '-' + new Date(data.createdAt || new Date(0)).getTime();
                }

                return done();
            });
        }
        else done();

        function slugify(text) {
            text = text.toLowerCase();
            text = text.replace(/[^-a-zA-Z0-9\s]+/ig, '');
            text = text.replace(/-/gi, '_');
            text = text.replace(/\s/gi, '-');
            text = text.replace(/-+$/, '');
            return text;
        }
    };

    /**
     * votes on an option in the poll
     *
     * @param  {[Number]} userId   [id of voting user]
     * @param  {[Number]} optionId [id of option to vote for]
     */
    Content.prototype.vote = function (userId, optionId) {
        //first remove any existing vote for this user
        this.poll.options.forEach(function (option) {
            if (option.userIds.indexOf(userId) > -1) {
                option.votes--;
                option.userIds = _.reject(option.userIds, function (id) {
                    return id == userId;
                });
            }
        });

        //now add the vote
        var option = _.find(this.poll.options, function (option) {
            return option.id == optionId;
        });

        option.userIds.push(userId);
        option.votes++;

        //now recalculate total and all percentages
        this.poll.total = total = _.pluck(this.poll.options, 'votes').reduce(function (a, b) {
            return a + b;
        });

        this.poll.options.forEach(function (option) {
            option.percentage = parseInt(100 * option.votes / total);
        });
    };

    /**
     * populates all of the user objects for the specified content list
     *
     * @param  {[list]}   list     [list of content to populate]
     * @param  {Function} callback [continuation function]
     */
    Content.populateUsers = function (list, callback) {
        var userIds = [];

        //if the list is not a list, make it a list
        if (!list.length && list.id) list = [list];

        list.forEach(function (post) {
            if (post.authorId && userIds.indexOf(post.authorId) == -1) userIds.push(post.authorId);

            (post.likes || []).forEach(function (like) {
                if (like.userId && userIds.indexOf(like.userId) == -1) userIds.push(like.userId);
            });

            (post.comments || []).forEach(function (comment) {
                if (comment.authorId && userIds.indexOf(comment.authorId) == -1) userIds.push(comment.authorId);
            });
        });

        if (userIds.length === 0) return callback(null, list);

        function findUser(users, id) {
            var user = _.find(users, function (user) {
                return user.id == id;
            });
            return user && user.toPublicObject();
        }

        //load all of the users
        User.all({ where: { id: { inq: userIds }}}, function (err, users) {
            list.forEach(function (post) {
                post.author = findUser(users, post.authorId) || post.author;

                (post.likes || []).forEach(function (like) {
                    like.user = findUser(users, like.userId);
                });

                (post.comments || []).forEach(function (comment) {
                    comment.author = findUser(users, comment.authorId) || comment.author;
                });
            });

            callback(err, list);
        });
    };



    /**
     * gets the default permalink url
     *
     * @return {[String]}
     */
    Content.prototype.permalink = function () {
        return 'PERMALINK NOT IMPLEMENTED';
        var sp = api.module.getSpecialPageByContentType(this.type);
        if (!sp) {
            // throw new Error('Content type ' + this.type + ' is not supported');
            console.log('Content type ' + this.type + ' is not supported');
            return '';
        }
        var url = sp.path(this.group, {id: this.id});
        return url;
    };

    /**
     * add content item to newsfeed for all group members and author's followers (and author)
     *
     * @param  {Function} done [continuation function]
     */
    Content.afterCreate = function (done) {
        return done();

        // 1. send notifications to websockets
        api.socket.send(this.groupId, 'content:created', {
            id: this.id,
            authorId: this.authorId,
            type: this.type,
            tags: this.tags,
            category: this.category
        });

        // 3. populate feeds
        var content = this;
        var userIds = [content.authorId];
        var wait = 1;

        // all users from the group
        if (content.privacy === 'public') {
            wait += 1;
            User.all({where: {'membership:groupId': content.groupId}}, function (err, users) {
                users.forEach(function (u) {
                    if (u.id == content.authorId) return;
                    if (userIds.indexOf(u.id) === -1) {
                        userIds.push(u.id);
                    }
                });
                ok();
            });
        }

        // all followers of author
        if (content.authorId && User.getFollowersOf) {
            wait += 1;
            User.getFollowersOf(content.authorId, function (err, ids) {
                ids.forEach(function (id) {
                    if (userIds.indexOf(id) === -1) {
                        userIds.push(id);
                    }
                });
                ok();
            });
        }

        //calculate replies for this post's parent async
        if (content.replyToId) {
            Content.find(content.replyToId, function (err, parent) {
                if (parent) {
                    parent.recalculateReplies(function () {
                        parent.save();
                    });
                }
            });
        }

        ok();

        function ok() {
            if (--wait === 0) {
                var cmd = [];
                userIds.forEach(function (id) {
                    cmd.push([ 'LPUSH', 'list:UserNewsFeed:' + id, content.id ]);
                    cmd.push([ 'SADD', 'set:UserNewsFeed:' + id, content.id]);
                });
                if (cmd.length) {
                    redis.multi(cmd, function (err) {
                        if (err) console.log(err);
                        done()
                    });
                } else {
                    done();
                }
            }
        }
    };

    /**
     * cleans up anything related to this post after it is deleted
     *
     * @param  {Function} done [continuation function]
     */
    Content.afterDestroy = function (done) {
        var content = this;

        //calculate replies for this post's parent async
        if (content.replyToId) {
            Content.find(content.replyToId, function (err, parent) {
                if (parent) {
                    parent.recalculateReplies(function () {
                        parent.save();
                    });
                }
            });
        }

        done();
    }

    /**
     * Get the news feed for the specified user
     *
     * @param  {[params]}   params
     * @param  {Function}   callback [continuation function]
     */
    User.prototype.feed = function (params, callback) {
        redis.lrange(['list:UserNewsFeed:' + this.id, 0, 100], function (err, ids) {
            if (err) return callback(err);

            var cmd = ids.map(function (id) {
                return [ 'GET', redis.modelName('Content') + ':' + id ];
            });
            if (cmd.length) {
                redis.multi(cmd, function (err, responses) {
                    callback(err, responses.map(function (json) {
                        return new Content(JSON.parse(json));
                    }));
                });
            } else {
                callback(err, []);
            }
        });
    };

    /**
     * Register a page view for this content and saves
     */
    Content.prototype.registerView = function () {
        this.views++;
        this.save();
    };

    /**
     * Calculate the total number of replies to this post
     *
     * @param  {Function} callback [continuation function]
     */
    Content.prototype.recalculateReplies = function (callback) {
        var content = this;
        Content.all({ where: { replyToId: this.id }}, function (err, posts) {
            content.repliesTotal = posts.length;
            callback();
        });
    };

    Content.prototype.createdAtNice = function () {
        var post = this;
        var diff = new Date() - post.createdAt;
        var oneHour = 1000 * 60 * 60;

        if (diff < oneHour / 2) {
            return moment(post.createdAt).fromNow();
        } else if (diff < oneHour * 12) {
            return moment(post.createdAt).format('ddd [' + 'at' + '] HH:mm');
        } else {
            return moment(post.createdAt).format('ddd DD MMM YYYY');
        }
    };

    /**
     * Post a comment on this content item.
     *
     * @param  {Number}   authorId - id of the author
     * @param  {String}   text     - comment text
     * @param  {Function} callback - callback function
     */
    Content.prototype.postComment = function (authorId, text, callback) {
        var data = {
            contentId: this.id,
            groupId: this.groupId,
            authorId: authorId,
            createdAt: new Date(),
            text: text
        };

        Comment.create(data, callback);
    };

    /**
     * Delete a comment attached to this post.
     *
     * @param  {Number}   userId    - id of the deleting user
     * @param  {Number}   commentId - id of the comment to delete
     * @param  {Function} callback  - callback function
     */
    Content.prototype.deleteComment = function (userId, commentId, callback) {
        Comment.findOne(commentId, function (err, comment) {
            var hasPermission = false;
            // TODO: check group admin permissions

            if (!comment) {
                return callback(new Error('Comment not found'));
            }
            if ((comment.authorId != userId || comment.contentId != this.id) && !hasPermission) {
                return callback(new Error('Permission denied'));
            }

            comment.destroy(callback);
        });
    };

    /**
     * Update the comments cached on a content record and the total comment
     * count.
     *
     * @param  {Number}   contentId - id of the content
     * @param  {Function} callback  - callback function
     */
    Content.updateComments = function (contentId, callback) {
        Content.find(contentId, function (err, post) {
            if (post) {
                Comment.all({ where: { contentId: post.id }, limit: Content.CACHEDCOMMENTS, order: 'createdAt DESC' }, function (err, comments) {
                    Content.populateUsers(comments, function (err, comments) {
                        post.commentsTotal = comments.countBeforeLimit;
                        post.comments.items = [];

                        // reverse the comments so we can show latest at the end
                        comments = comments.reverse();

                        comments.forEach(function (comment) {
                            post.comments.push(comment.toObject());
                        });

                        post.save(callback);
                    });
                });
            } else if (callback) {
                callback();
            }
        });
    };

    /**
     * Update the likes cached on a content record and record the total like
     * count.
     *
     * @param  {Number}   contentId - id of the content
     * @param  {Function} callback  - callback function
     */
    Content.updateLikes = function (contentId, callback) {
        Content.find(contentId, function (err, post) {
            if (!post) {
                if (callback) {
                    callback();
                }
                return;
            }

            Like.all({ where: { contentId: contentId }, limit: Content.CACHEDLIKES }, function (err, likes) {
                post.likesTotal = likes.countBeforeLimit;
                post.likes.items = [];

                // reverse the likes so we can show latest at the end
                likes.reverse();

                likes.forEach(function (like) {
                    post.likes.push(like.toObject());
                });

                post.save(callback);
            });
        });
    };

    /**
     * Get a like if a user likes this content item.
     *
     * @param  {User}     user     - user or userId
     * @param  {Function} callback - callback function
     */
    Content.prototype.getLike = function (user, callback) {
        var userId = user.id || user;
        Like.all({ where: { userId: userId, contentId: this.id }}, function (err, likes) {
            callback(err, likes[0]);
        });
    };

    /**
     * Get whether the specified user likes this content item.
     * 
     * @param  {User}     user     - user or userId
     * @param  {Function} callback - callback function
     */
    Content.prototype.doesUserLike = function (user, callback) {
        this.getLike(user, function (err, like) {
            callback(err, like != null);
        });
    };

    /**
     * Like or unlike a content item.
     *
     * @param  {User}     user     - user performing the like
     * @param  {Function} callback - callback function
     */
    Content.prototype.like = function (user, callback) {
        var self = this;
        var doesLike = false;

        self.getLike(user, function (err, like) {
            if (like) {
                like.destroy(done);
            } else {
                doesLike = true;
                Like.create({
                    userId: user.id || user,
                    contentId: self.id,
                    groupId: self.groupId
                }, done);
            }
        });

        // in the callback, make sure the content is reloaded from the database
        function done(err) {
            if (callback) {
                Content.find(self.id, function (err, content) {
                    callback(err, content, doesLike);
                });
            }
        }
    };

    /**
     * Dislike or un-dislike a content item.
     *
     * @param  {User}     user     - user performing the dislike
     * @param  {Function} callback - callback function
     */
    Content.prototype.dislike = function (user, callback) {
        if (this.dislikes.find(user.id, 'userId')) {
            this.dislikes.remove(this.dislikes.find(user.id, 'userId'));
        } else {
            this.dislikes.push({
                userId: user.id,
                username: user.username,
                createdAt: new Date()
            });
        }

        this.save(callback);
    };

    /**
     * Flag or unflag a content item.
     *
     * @param  {User}     user     - user performing the flag
     * @param  {Function} callback - callback function
     */
    Content.prototype.flag = function (user, callback) {
        if (this.flags.find(user.id, 'userId')) {
            this.flags.remove(this.flags.find(user.id, 'userId'));
        } else {
            this.flags.push({
                userId: user.id,
                username: user.username,
                createdAt: new Date()
            });
        }

        this.save(callback);
    };

    /**
     * Clear all of the flags from this content item.
     * @param  {Function} callback - callback function
     */
    Content.prototype.clearFlags = function (callback) {
        this.flags.items = [];
        this.save(callback);
    };

    /**
     * Delete this post and blacklist the author from the group it was posted to.
     *
     * @param  {Function} callback - call back function
     */
    Content.prototype.destroyAndBan = function (callback) {
        var post = this;

        User.find(this.authorId, function (err, user) {
            user.setMembershipState(post.groupId, 'blacklisted', function (err, user) {
                post.destroy(callback);
            });
        });
    };

    /**
     * Set the the doesLike properties for a list of content items.
     *
     * @param {Array}    posts    - list of posts
     * @param {User}     user     - logged in user
     * @param {Function} callback - callback
     */
    Content.setDoesLikes = function (posts, user, callback) {
        if (!user) {
            return callback(null, posts);
        }

        //if the posts list is not a list, make it a list
        if (!posts.length && posts.id) posts = [posts];

        Like.getLikeIds(user.id, function (err, ids) {
            posts.forEach(function (post) {
                post.doesLike = ids.indexOf(post.id) > -1;
            });

            callback(err, posts);
        });
    };

    /**
     * Load content and set the the doesLike properties for a list of content 
     * items for the specified user.
     *
     * @param {Object}   query    - query to run to find content
     * @param {User}     user     - logged in user
     * @param {Function} callback - callback
     */
    Content.allWithLikes = function (query, user, callback) {
        var likeIds = [];
        var posts = null;

        async.parallel([
            function (done) {
                Content.all(query, function (err, results) {
                    posts = results;
                    done();
                });
            },
            function (done) {
                if (!user) {
                    return done();
                }
                Like.getLikeIds(user.id, function (err, ids) {
                    likeIds = ids;
                    done();
                });
            }
        ], function (err) {
            if (err) {
                return callback(err);
            }

            posts.forEach(function (post) {
                post.doesLike = likeIds.indexOf(post.id) > -1;
            });

            callback(err, posts);
        });
    };
};

