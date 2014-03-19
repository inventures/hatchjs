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

var fs = require('fs');
var fsTools = require('fs-tools');
var path = require('path');
var util = require('util');
var im = require('imagemagick');

module.exports = UploadController;

function UploadController(init) {
    
}

/**
 * Upload a file and return it's URL and media object.
 * 
 * @param  {HttpContext} c - http context
 */
UploadController.prototype.upload = function (c) {
    var params = {
        groupId: c.req.group.id,
        userId: c.req.user && c.req.user.id,
        size: c.req.param('size'),
        path: c.req.param('path')
    };

    var url = c.req.param('url');

    if (url) {
        c.Media.createWithUrl(url, params, callback);
    } else {
        c.Media.createWithFiles(c.req.files, params, callback);
    }

    function callback (err, media) {
        if (err) {
            return c.send({
                status: 'error',
                message: err.message
            });
        }

        // needed for flash response = meh!
        c.res.contentType('text/html');

        c.send({
            status: 'success',
            url: media.url,
            media: media
        });
    }
};

