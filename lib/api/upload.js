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
var fs = require('fs');
var fsTools = require('fs-tools');
var path = require('path');
var util = require('util');
var im = require('imagemagick');

module.exports = UploadAPI;

function UploadAPI(hatch) {
    this.hatch = hatch;
    this.app = hatch.app;
    this.compound = hatch.compound;
}

/**
 * Upload a file or set of files. If they are image files, they will be analysed
 * and the size appended to the returned URL.
 * 
 * @param  {HttpRequest}   req      - http request
 * @param  {Function}      callback - callback function(err, urls)
 */
UploadAPI.prototype.upload = function (req, callback) {
    var Media = this.compound.Media;
    var urls = [];

    // move each of the files to the correct upload path
    async.each(Object.keys(req.files), function (key, done) {
        var file = req.files[key];
        var filename = file.name;

        var originalFilename = filename;
        
        // TODO: amend this crappy things
        var uploadPath = '/tmp'; // c.compound.app.config.paths.upload;
        var disableImageDimensions = false;// c.api.app.config.disableImageDimensions;

        // if we have uploaded an image, use imageMagick to get the dimensions of the image
        if (['jpg', 'jpeg', 'png', 'gif'].indexOf(filename.split('.').pop()) > -1 && !disableImageDimensions) {
            try {
                im.identify(file.path, function (err, features) {
                    if (features && features.width && features.height) {
                        filename = filename.substring(0, filename.lastIndexOf('.')) + '_' + features.width + 'x' + features.height + filename.substring(filename.lastIndexOf('.'));
                    }

                    doUpload();
                });
            } catch (ex) {
                // don't worry about errors - not working out the size isn't critical
                doUpload();
            }
        } else {
            doUpload();
        }

        function doUpload() {
            // url-ify the filename
            filename = slugify(filename);
            originalFilename = filename;

            // check if the file already exists and use a different filename instead
            var check = 1;
            while (fs.existsSync(path.join(uploadPath, filename))) {
                filename = originalFilename;
                filename = filename.substring(0, filename.lastIndexOf('.')) + '_' + (check++) + filename.substring(filename.lastIndexOf('.'));
            }

            // the url of the resulting file
            var url = '/upload/' + filename;

            // move the file to its correct path
            fsTools.move(file.path, path.join(uploadPath, filename), function (err) {
                if (req.query.add) {
                    Media.create({
                        type: req.query.type,
                        url: url,
                        createdAt: new Date(),
                        userId: req.user.id
                    });
                }

                urls.push(url);
                done();
            });
        }
    }, function (err) {
        callback(err, urls);
    });

    function slugify(text) {
        text = text.toLowerCase();
        text = text.replace(/[^_-a-zA-Z0-9\.\s]+/ig, '');
        text = text.replace(/\s/gi, "-");
        return text;
    }
};
