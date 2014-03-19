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

var crypto = require('crypto');

module.exports = function (compound, ImportStream) {
    var ticker;
    var Group = compound.models.Group;
    var Content = compound.models.Content;

    ImportStream.validatesPresenceOf('title', 'query');


    ImportStream.beforeCreate = function (next) {
        this.hash = compound.hatch.crypto.calcSha(this.url + '-' + new Date().getTime());
        next();
    };

    /**
     * Get an ImportStream by it's secret hash code
     * 
     * @param  {String}   hash     - hash to retrieve stream
     * @param  {Function} callback - callback function
     */
    ImportStream.getByHash = function (hash, callback) {
        ImportStream.all({ where: { hash: hash }}, function (err, streams) {
            callback(err, streams[0]);
        });
    };

    /**
     * runs this import stream and imports the data
     */
    ImportStream.prototype.run = function () {
        var stream = this;

        Group.find(stream.groupId, function(err, group) {
            compound.hatch.importStream.runImport(stream, createContent);

            function createContent(err, posts) {
                if(err) {
                    console.log(err);
                    return done();
                }

                posts.forEach(function(content) {
                    createIfNotExists(content);
                });

                done();
            }

            function createIfNotExists(content) {
                //look for an existing post - don't create the same posts twice
                Content.count({ groupId: stream.groupId, url: content.url }, function(err, count) {
                    if(count > 0) return;

                    //save the new post to the database
                    Content.create(content, function(err, content) {
                        console.log('new content imported: ' + content.id);
                    });
                });
            }    

            function done() {
                //update last run date, save and forget
                stream.lastRun = new Date();
                stream.save();

                //if we have tags, recalculate group tags
                if(stream.tags) {
                    group.recalculateTagContentCounts();
                }
            }
        });    
    };

    /**
     * works out if this stream should run
     * 
     * @return {[Boolean]}
     */
    ImportStream.prototype.shouldRun = function() {
        return new Date().getTime() - (this.lastRun || 0) > this.interval;
    };
};
