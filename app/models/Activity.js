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

var async = require('async');

module.exports = function (compound, Activity) {
    var Content = compound.models.Content;
    var MODELS = ['Content', 'Comment', 'Like', 'Page'];

    /**
     * Attaches event handlers to Content creation and update to automatically
     * create an associated activity record.
     */
    process.nextTick(function () {
        MODELS.forEach(function (modelName) {
            var model = compound.models[modelName];

            var afterUpdate = model.afterUpdate;
            model.afterUpdate = function (done, obj) {
                var self = this;
                Activity.generateActivity(obj || self, model.modelName, 'update', next);

                function next() {
                    if (afterUpdate) {
                        afterUpdate.call(self, done, obj);
                    } else {
                        done();
                    }
                }
            };

            var afterCreate = model.afterCreate;
            model.afterCreate = function (done, obj) {
                var self = this;
                Activity.generateActivity(obj || self, model.modelName, 'create', next);

                function next() {
                    if (afterCreate) {
                        afterCreate.call(self, done, obj);
                    } else {
                        done();
                    }
                }
            };

            var afterDestroy = model.afterDestroy;
            model.afterDestroy = function (done, obj) {
                var self = this;
                Activity.destroyActivity(obj || self, model.modelName, next);

                function next() {
                    if (afterDestroy) {
                        afterDestroy.call(self, done, obj);
                    } else {
                        done();
                    }
                }
            };
        });
    });

    /**
     * Generate an activity based on an action on a database object.
     * 
     * @param  {Object}   obj      - object being acted upon
     * @param  {String}   action   - action
     * @param  {Function} callback - callback function
     */
    Activity.generateActivity = function (obj, type, action, callback) {
        var publicObj = obj.toPublicObject && obj.toPublicObject() || obj;

        var activity = {
            createdAt: new Date(),
            type: type,
            action: action,
            userId: obj.userId || obj.authorId,
            objectId: obj.id,
            object: publicObj,
            groupId: obj.groupId
        };

        Activity.create(activity, callback);
    };

    /**
     * Delete the activity associated with the specified object and type. 
     * 
     * @param  {Object}   obj      - object being deleted
     * @param  {String}   type     - object type
     * @param  {Function} callback - callback function
     */
    Activity.destroyActivity = function (obj, type, callback) {
        Activity.findOne({ where: { objectId: obj.id, type: type }}, function (err, activity) {
            if (activity) {
                activity.destroy(callback);
            } else if (callback) {
                callback();
            }
        });
    };
};