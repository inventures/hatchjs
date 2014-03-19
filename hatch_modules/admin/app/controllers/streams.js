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

var Content = require('./content');
var Application = require('./application');

module.exports = StreamsController;

function StreamsController(init) {
    Content.call(this, init);

    init.before(function setup(c) {
        var importStream = c.compound.hatch.importStream;
        this.importers = importStream.getImporters();
        c.next();
    });

    init.before(findStream, {only: ['edit', 'update', 'destroy', 'toggle']});
}

// install the tab group within content
Application.installTabGroup('content', function (c) {
    if(!c.req.group.getModule('admin').contract.streamsEnabled) {
        return [];
    }

    var subTabs = [];

    // import streams
    subTabs.push({ header: 'streams.headers.import' });
    subTabs.push({ name: 'streams.actions.manage', url: c.pathTo.streams });
    subTabs.push({ name: 'streams.actions.add', url: c.pathTo.newStream });

    return subTabs;
});

// finds the stream for the action
function findStream (c) {
    c.ImportStream.find(c.params.id || c.params.stream_id, function(err, stream) {
        c.stream = c.locals.stream = stream;
        c.next();
    });
}

require('util').inherits(StreamsController, Content);

/**
 * Show the import streams defined for this group.
 * 
 * @param  {HttpContext} c - http context
 */
StreamsController.prototype.index = function(c) {
    var ImportStream = c.ImportStream;
    this.pageName = 'manage-streams';

    ImportStream.all({ where: { groupId: c.req.group.id }}, function(err, streams) {
        c.locals.streams = streams;
        c.render();
    });
};

/**
 * Show the new import stream form.
 * 
 * @param  {HttpContext} c - http context
 */
StreamsController.prototype.new = function(c) {
    this.pageName = 'new-stream';
    this.stream = new c.ImportStream();
    c.render();
};

/**
 * Edit an existing import stream.
 * 
 * @param  {HttpContext} c - http context
 *                       c.id - import stream id
 */
StreamsController.prototype.edit = function(c) {
    this.pageName = 'manage-streams';
    c.render();
};

/**
 * Create a new import stream.
 * 
 * @param  {HttpContext} c - http context
 *                       c.body - import stream body
 */
StreamsController.prototype.create = function(c) {
    var stream = new c.ImportStream(c.body);
    
    stream.groupId = c.req.group.id;
    stream.enabled = true;
    stream.tagModelName = 'Content';

    c.Tag.assignTagsForObject(stream, stream.tags, function () {
        stream.save(function(err) {
            if(err) {
                return c.sendError(err);
            }

            c.flash('info', c.t('models.ImportStream.messages.saved'));
            c.redirect(c.pathTo.streams);
        });
    });
};

/**
 * Update an existing import stream.
 * 
 * @param  {HttpContext} c - http context
 *                       c.body - import stream body
 */
StreamsController.prototype.update = function(c) {
    var self = this;
    var data = c.req.body;

    data.groupId = c.req.group.id;
    data.tagModelName = 'Content';

    c.Tag.assignTagsForObject(data, data.tags, function () {
        self.stream.updateAttributes(data, function (err) {
            if(err) {
                c.sendError(err);
            } else {
                c.flash('info', c.t('models.ImportStream.messages.saved'));
                c.redirect(c.pathTo.streams);
            }
        });
    });
};

/**
 * Delete an import stream.
 * 
 * @param  {HttpContext} c - http context
 *                       c.id - import stream id to delete
 */
StreamsController.prototype.destroy = function(c) {
    c.stream.destroy(function() {
        c.flash('info', c.t('models.ImportStream.messages.deleted'));
        c.send({ redirect: c.pathTo.streams() });
    });
};

/**
 * Pause or restart an import stream.
 * 
 * @param  {HttpContext} c - http context
 *                       c.id - import stream id to toggle
 */
StreamsController.prototype.toggle = function(c) {
    this.stream.enabled = !this.stream.enabled;
    this.stream.save(function() {
        c.flash('info', c.t('models.ImportStream.messages.toggled'));
        c.send({ redirect: c.pathTo.streams() });
    });
};
