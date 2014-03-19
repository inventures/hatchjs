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

module.exports = function (compound, Like) {
    var Content = compound.models.Content;
    var _ = require('underscore');

    // validation
    Like.validatesPresenceOf('contentId', 'userId');

    /**
     * Set the date automatically if we don't have one.
     *
     * @param  {Function} next - callback function
     */
    Like.beforeSave = function (next) {
        if (!this.createdAt) {
            this.createdAt = new Date();
        }
        next();
    };

    /**
     * After a like is saved, update the parent content item.
     *
     * @param  {Function} next - callback function
     */
    Like.afterSave = function (next) {
        Content.updateLikes(this.contentId, next);
    };

    /**
     * After a like is deleted, update the parent content item.
     *
     * @param  {Function} next - callback function
     */
    Like.afterDestroy = function (next) {
        Content.updateLikes(this.contentId, next);
    };

    /**
     * Check whether the specified content is liked by the specified user.
     *
     * @param  {Number}   contentId - id of the content
     * @param  {Number}   userId    - id of the user
     * @param  {Function} callback  [description]
     * @return {[type]}             [description]
     */
    Like.doesLike = function (contentId, userId, callback) {
        Like.findOne({ where: { contentId: contentId, userId: userId }}, function (err, like) {
            callback (err, like != null);
        });
    };

    /**
     * Get all of the likes for the specified user.
     *
     * @param  {Number}   userId   - id of the user
     * @param  {Function} callback - callback function
     */
    Like.getLikes = function (userId, callback) {
        Like.all({ where: { userId: userId }}, callback);
    };

    /**
     * Get all of the content ids for likes for the specified user.
     *
     * @param  {Number}   userId   - id of the user
     * @param  {Function} callback - callback function
     */
    Like.getLikeIds = function (userId, callback) {
        Like.getLikes(userId, function (err, likes) {
            callback(err, !err && _.pluck(likes, 'contentId'));
        });
    };
};
