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

module.exports = function (compound, Cache) {
    Cache.getter.pageAndKey = function () {
        return this.pageId + '-' + this.key;
    };

    Cache.add = function (pageId, key, text, timeout, callback) {
        var cache = {
            pageId: pageId,
            key: key,
            text: text
        };
        Cache.create(cache, function (err, cache) {
            // TODO: expire the key after the timeout
            
            if (callback) {
                callback(err, cache);
            }
        });
    };

    Cache.invalidate = function (pageId, key, callback) {
        Cache.get(pageId, key, function (err, cache) {
            cache.destroy(callback);
        });
    };

    Cache.invalidateAll = function (pageId, callback) {
        Cache.getAll(pageId, function (err, caches) {
            async.forEach(caches, function (cache, done) {
                cache.destroy(done);
            }, callback);
        });
    };

    Cache.get = function (pageId, key, callback) {
        Cache.all({ where: { pageAndKey: pageId + '-' + key}}, callback);
    };

    Cache.getAll = function (pageId, callback) {
        Cache.all({ where: { pageId: pageId }}, callback);
    };
};