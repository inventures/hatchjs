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

module.exports = function (compound, Comment) {
    var Content = compound.models.Content;

    // validation
    Comment.validatesPresenceOf('contentId', 'authorId', 'text');

    /**
     * Get whether this comment has been flagged.
     *
     * @return {Boolean}
     */
    Comment.getter.hasFlag = function () {
        return this.flags.length > 0;
    };

    /**
     * Set the date automatically if we don't have one.
     *
     * @param  {Function} next - callback function
     */
    Content.beforeSave = function (next) {
        if (!this.createdAt) {
            this.createdAt = new Date();
        }
        next();
    };

    /**
     * After a comment is saved, update the parent content item.
     *
     * @param  {Function} next - callback function
     */
    Comment.afterSave = function (next) {
        Content.updateComments(this.contentId, next);
    };

    /**
     * After a comment is deleted, update the parent content item.
     *
     * @param  {Function} next - callback function
     */
    Comment.afterDestroy = function (next) {
        Content.updateComments(this.contentId, next);
    };

    /**
     * Like or unlike a comment.
     *
     * @param  {User}     user     - user performing the like
     * @param  {Function} callback - callback function
     */
    Comment.prototype.like = function (user, callback) {
        if (this.likes.find(user.id, 'userId')) {
            this.likes.remove(this.likes.find(user.id, 'userId'));
        } else {
            this.likes.push({
                userId: user.id,
                username: user.username,
                createdAt: new Date()
            });
        }

        this.save(callback);
    };

    /**
     * Flag or unflag a comment.
     *
     * @param  {User}     user     - user performing the flag
     * @param  {Function} callback - callback function
     */
    Comment.prototype.flag = function (user, callback) {
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
     * Clear all of the flags from this comment.
     * @param  {Function} callback - callback function
     */
    Comment.prototype.clearFlags = function (callback) {
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
        })
    };
};
