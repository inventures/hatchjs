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
var httpPost = require('http-post');

module.exports = function (compound, Tag) {
    'use strict';

    Tag.validatesPresenceOf('title', {message: 'Please enter a title'});
    Tag.validatesUniquenessOf('name', {message: 'This tag name is taken'});

    /**
     * Get the 'groupId-type' shortcut index.
     *
     * @return {String} groupId+type
     */
    Tag.getter.groupIdByType = function () {
        return (this.groupId || '0') + '-' + this.type;
    };

    /**
     * Before this tag is validated, make sure it has a name value - this is auto-
     * calculated from groupId + title.
     *
     * @param  {Function} next - continuation function
     */
    Tag.beforeValidate = function (next) {
        if (!this.name) {
            this.name = (this.groupId ? (this.groupId + '-') : '') + slugify(this.title) + '-' + this.type;
        }

        next();
    };

    /**
     * Before this tag is created, make sure it has a name value - this is auto-
     * calculated from groupId + title.
     *
     * @param  {Function} next - continuation function
     */
    Tag.beforeSave = function (next) {
        if (!this.count) {
            this.count = 0;
        }

        next();
    };

    /**
     * Before this tag is destroyed, make sure all objects referencing it are
     * de-refernced (removed) from it's collection.
     *
     * @param  {Function} next - continuation function
     */
    Tag.beforeDestroy = function (next) {
        var tag = this;

        // remove this tag from all of it's results
        tag.getResults({}, function (err, results) {
            async.forEach(results, function (obj, done) {
                obj.tags.remove(tag);
                obj.save(done);
            }, function () {
                next();
            });
        });
    };

    /**
     * Assign tags to an object from req.body data containing an array of tag
     * ids. This function will automatically recalculate the tag counts for all
     * tags involved in this transaction - both those being removed and added to
     * the object tags list.
     *
     * @param  {Object}   obj      - db entity to assign tags for
     * @param  {Object}   data     - req.body.tags containing tag ids
     * @param  {Function} callback - callback function
     */
    Tag.assignTagsForObject = function (obj, data, callback) {
        var updateTags = [];

        // fix mising tag data - replace with empty array
        if (!data) {
            data = [];
        }

        // fix single tagIds that are sometimes not an array
        if (typeof data !== 'object') {
            data = [data];
        }

        if (!obj.tags || !obj.tags.forEach) {
            obj.tags = [];
        }

        // add the existing tags to the update collection
        obj.tags.forEach(function (tag) {
            if (tag.id) {
                updateTags.push(tag.id);
            }
        });

        // remove all of the existing tags from the object
        if (obj.tags.items) {
            obj.tags.items = [];
        } else {
            obj.tags = [];
        }

        // assign the tags from the body data
        async.forEach(data, function (tagId, done) {
            Tag.find(tagId, function (err, tag) {
                function pushTag(tag) {
                    // update the tag model
                    tag.updateModel();

                    obj.tags.push({
                        id: tag.id,
                        title: tag.title
                    });

                    if (updateTags.indexOf(tagId) === -1) {
                        updateTags.push(tag.id);
                    }

                    done();
                }

                // if the tag was not found, create it
                if (!tag && typeof tagId === 'string') {
                    // search for a tag with the same title and group
                    Tag.findOne({ where: { title: tagId, groupId: obj.groupId }}, function (err, tag) {
                        if (tag) {
                            pushTag(tag);
                        } else {
                            tag = {
                                title: tagId,
                                groupId: obj.groupId,
                                type: data.tagModelName || obj.tagModelName || obj.constructor.modelName,
                                sortOrder: 'id DESC'
                            };

                            Tag.create(tag, function (err, tag) {
                                pushTag(tag);
                            });
                        }
                    });
                } else if(tag) {
                    pushTag(tag);
                } else {
                    done();
                }
            });
        }, function (err) {
            // wrap the save function for this object to intercept the callback
            // and insert the command to update the tag counts
            var save = obj.save;

            if (save) {
                obj.save = function (options, callback) {
                    if (typeof options === 'function') {
                        callback = options;
                        options = {};
                    }

                    save.call(obj, options, function (err, obj) {
                        runTagUpdate();

                        if (callback) {
                            callback(err, obj);
                        }
                    });
                };
            } else {
                // we still need a timeout if the obj is not a db entity. this
                // can happen if we are updating the data to be used to create
                // a new db entity
                setTimeout(runTagUpdate, 500);
            }

            callback(err, obj);
        });

        function runTagUpdate() {
            updateTags.forEach(function (tagId) {
                Tag.find(tagId, function (err, tag) {
                    tag.updateCount();
                });
            });
        }
    };

    /**
     * Find a tag by it's name.
     *
     * @param  {string}   name     - name of the tag
     * @param  {Function} callback - callback function
     */
    Tag.findByName = function (name, callback) {
        Tag.all({ where: { name: name }}, function (err, tags) {
            callback(err, tags[0]);
        });
    };

    /**
     * Get the results of this tag by querying the database.
     *
     * @param  {Object}   params     - standard jugglingdb query params
     * @param  {Function} callback   - callback function
     */
    Tag.prototype.getResults = function (params, callback) {
        var tag = this;
        var model = compound.models[tag.type];

        var offset = params.offset || 0;
        var limit = params.limit;
        var cond = { tags: tag.id };

        if (typeof limit === undefined || limit === null) {
            limit = 10;
        }

        var query = {
            offset: offset,
            limit: limit,
            where: cond
        };

        model.all(query, function (err, results) {
            //set the type so that the subscriber knows what it is getting
            results.type = tag.type;

            callback(err, results);
        });
    };

    /**
     * Check to see if this tag has been updated since the specified date.
     *
     * @param  {Date}    since - date to check
     * @return {Boolean}       - whether the tag has been updated
     */
    Tag.ping = function (since) {
        since = new Date(since).getTime();
        return this.updatedAt > since;
    };

    /**
     * Update the compound model for the specified tag to make sure the custom
     * sort order is defined for the specified tag.
     *
     * This is needed before any items that use this tag can be saved so that
     * the sort orders are correct when they are queried by tag.
     *
     * @param  {Tag} tag - tag to check for
     */
    Tag.updateModel = function (tag) {
        if (!tag.sortOrder) {
            return;
        }

        var settings = compound.models[tag.type].schema.definitions[tag.type].settings;
        if (!settings.customSort) {
            settings.customSort = {};
        }

        if (!settings.customSort['tags.' + tag.id]) {
            settings.customSort['tags.' + tag.id] = tag.sortOrder;
        }
    };

    /**
     * Updates the compound model for the specified tag to make sure the custom
     * sort order is defined for the specified tag.
     *
     * This is needed before any items that use this tag can be saved so that
     * the sort orders are correct when they are queried by tag.
     */
    Tag.prototype.updateModel = function () {
        Tag.updateModel(this);
    };

    /**
     * Rebuild the index for this tag. This should be used if the sort order
     * for this tag has been modified.
     */
    Tag.prototype.rebuildIndex = function () {
        Tag.rebuildIndex(this);
    };

    /**
     * Rebuild the index for this tag. This should be used if the sort order
     * for this tag has been modified.
     *
     * @param  {Tag} tag - tag to rebuild index for
     */
    Tag.rebuildIndex = function (tag) {
        //make sure the custom sort is correct in the schema
        Tag.updateModel(tag);

        //re-save every object
        compound.models[tag.type].all({ where: { tags: tag.name }}, function (err, data) {
            data.forEach(function (data) {
                data.save();
            });
        });
    };

    /**
     * Get the filter function for this tag.
     *
     * A filter function is used to automatically tag objects based on a
     * javascript. The filter is contained as a string within this.filter
     * property and the signature is always function (obj) { ... }.
     *
     * obj is a database entity of any type which has a 'tags' property.
     *
     * Examples:
     *
     *     // Here we are checking a content entity (obj) to see whether it has
     *     // more than 5 likes. We are returning true so that the 'popular'
     *     // tag is added to it's list of tags.
     *     function (obj) {
     *         return obj.likesTotal > 5;
     *     }
     *
     * @return {Function} - the filter function (if any)
     */
    Tag.prototype.filterFn = function () {
        if (!this.filter) {
            throw new Error('No filter defined');
        }
        return new Function(this.filter);
    };

    /**
     * Get whether an object matches this tag's filter function.
     *
     * @param  {object}   obj -object to test
     * @return {Boolean}       true or false
     */
    Tag.prototype.matchFilter = function (obj, callback) {
        if (!this.filter) {
            return callback(null, false);
        }
        var fn = this.filterFn()();

        // make sure obj is a concrete type
        if (obj.constructor === {}.constructor) {
            var Type = compound.models[this.type];
            obj = new Type(obj);
        }

        var res = fn.call({ compound: compound }, obj, callback);

        if (typeof res === 'boolean') {
            callback(null, res);
        }
    };

    /**
     * Update the count for this tag by querying the database and caching the
     * result.
     *
     * @param  {Function} callback - callback function
     */
    Tag.prototype.updateCount = function (callback) {
        var tag = this;
        if (!this.type) {
            if (callback) {
                callback();
            }
            return;
        }

        compound.model(this.type, false).count({ tags: tag.id }, function (err, count) {
            tag.count = count;
            tag.updatedAt = new Date();

            tag.pingSubscribers(function () {
                tag.save(callback);
            });
        });
    };

    /**
     * Update the tag count for the specified db entity object. This is often
     * useful when the object is deleted from the database, to decrement all of
     * the referenced tag counts.
     *
     * @param  {Object}   obj      - db entity object
     * @param  {Function} callback - callback function
     */
    Tag.updateCountsForObject = function (obj, callback) {
        async.forEach(obj.tags, function (tag, done) {
            Tag.find(tag.id, function (err, tag) {
                tag.updateCount(done);
            });
        }, callback);
    };

    /**
     * Update the counts for all tags (within a specific group/type - optional).
     *
     * @params {String}   type       - type of tag to update
     * @param  {Number}   groupId    - id of group - optional
     * @param  {Function} callback   - callback function
     */
    Tag.updateCounts = function (type, groupId, callback) {
        var cond = {};
        if (type) {
            cond.type = type;
        }
        if (groupId) {
            cond.groupId = groupId;
        }

        var query = {};
        if (Object.keys(cond).length > 0) {
            query.where = cond;
        }

        Tag.all(query, function (err, tags) {
            async.forEach(tags, function (tag, next) {
                tag.updateCount(next);
            }, function () {
                if (callback) {
                    callback();
                }
            });
        });
    };

    /**
     * Subscribe to this tag and receive pingbacks when the contents of this tag
     * are updated.
     *
     * @param  {string}   url      - pingback url to be posted to on updates
     * @param  {Number}   lease    - subscriber lease time in ms
     * @param  {Function} callback - callback function
     */
    Tag.prototype.subscribe = function (url, lease, callback) {
        //validate
        if (!url) {
            callback(new Error('Please specify a pingback URL'));
        }
        if (!lease || parseInt(lease, 10) < 60000) {
            callback(new Error('Please specify a lease of at least 60000 milliseconds'));
        }

        var now = new Date().getTime();

        var subscriber = {
            url: url,
            lease: lease,
            createdAt: now
        };

        //remove any duplicate subscribers
        this.subscribers = this.subscribers.filter(function (subscriber) {
            return subscriber.url !== url;
        });

        this.subscribers.push(subscriber);
        this.save(callback);
    };

    /**
     * Ping all of the subscribers to this tag. This should happen after the
     * contents of this tag have been updated in the database.
     *
     * The subscribers will then decide whether to re-query the API and retrieve
     * the new contents of this tag.
     *
     * @param  {Function} callback - callback function
     */
    Tag.prototype.pingSubscribers = function (callback) {
        var tag = this;
        var now = Date.now();

        //remove expired subscribers
        this.subscribers.items = this.subscribers.items.filter(function (subscriber) {
            if (!subscriber) {
                return false;
            }

            if (subscriber.invalid) {
                return false;
            }

            return now <= subscriber.createdAt + subscriber.lease;
        });

        async.forEach(this.subscribers, function (subscriber, done) {
            //ping the subscriber and remove those with invalid responses
            httpPost(subscriber.url, { updated: tag.updatedAt }, function (res) {
                res.on('data', function () {
                    subscriber.lastPing = new Date().getTime();

                    if (res.statusCode !== 200) {
                        subscriber.invalid = true;
                    }

                    done();
                });
            });
        }, function () {
            if (callback) {
                callback();
            }
        });
    };

    /**
     * Get all of the matching tags for the specified object by running the
     * tag filter functions (see above) to find matches.
     *
     * @param  {Object}     obj      - object to get matching tags for
     * @param  {Function}   callback - callback function
     */
    Tag.getMatchingTags = function (obj, callback) {
        Tag.all({ where: { type: obj.constructor.modelName }}, function (err, tags) {
            var matchingTags = [];

            async.forEach(tags, function (tag, done) {
                // skip group specific tags for other groups
                if (tag.groupId && tag.groupId !== obj.groupId) {
                    return done();
                }

                tag.matchFilter(obj, function (err, result) {
                    if (err) {
                        console.log('Error matching tag');
                        console.log(err);

                        return done();
                    }

                    if (result) {
                        matchingTags.push(tag);
                    }

                    done();
                });
            }, function (err) {
                callback(err, matchingTags);
            });
        });
    };

    /**
     * Apply matching tags to this object by running the
     * tag filter functions to find matches (see above).
     *
     * @param  {Object}     obj      - object to apply matching tags for
     * @param  {Function}   callback - callback function
     */
    Tag.applyMatchingTags = function (obj, callback) {
        // first remove all filter tags
        obj.tags = (obj.tags.items || obj.tags || []).filter(function (tag) {
            return !tag.filter;
        });

        Tag.getMatchingTags(obj, function (err, tags) {
            tags.forEach(function (tag) {
                if (!obj.tags) {
                    obj.tags = [];
                }

                var matching = obj.tags.some(function (t) {
                    return t.id === tag.id;
                });

                if (!matching) {
                    obj.tags.push({
                        id: tag.id,
                        title: tag.title,
                        filter: true
                    });

                    setTimeout(function () {
                        tag.updateCount();
                    }, 500);
                }
            });

            callback(err, obj);
        });
    };

    /**
     * Add an object to this tag collection.
     *
     * @param {Object}   obj      - db entity object
     * @param {Function} callback - callback function
     */
    Tag.prototype.add = function (obj, callback) {
        var self = this;

        if (!obj.tags) {
            return callback(new Error('does not support tags'));
        }

        this.updateModel();

        // wait to update count because this needs to happen *after* save
        setTimeout(function () {
            self.updateCount();
        }, 500);

        if (!obj.tags.find(self.id, 'id')) {
            obj.tags.push({
                id: self.id,
                title: self.title
            });
            callback(null, obj);
        } else {
            callback(null, obj);
        }
    };

    /**
     * Remove an object from this tag collection.
     *
     * @param  {Object}   obj      - db entity object
     * @param  {Function} callback - callback function
     */
    Tag.prototype.remove = function (obj, callback) {
        var self = this;

        if (!obj.tags) {
            return callback(new Error('does not support tags'));
        }

        this.updateModel();

        // wait to update count because this needs to happen *after* save
        setTimeout(function () {
            self.updateCount();
        }, 500);

        if (obj.tags.find(self.id, 'id')) {
            obj.tags.remove(self);
            callback(null, obj);
        } else {
            callback(null, obj);
        }
    };


    function slugify(text) {
        text = text.toLowerCase();
        text = text.replace(/[^-a-zA-Z0-9\s]+/ig, '');
        text = text.replace(/-/gi, '_');
        text = text.replace(/\s/gi, '-');
        return text;
    }
};
