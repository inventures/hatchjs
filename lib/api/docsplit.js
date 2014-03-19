//
// Hatch.js is a CMS and social website building framework built in Node.js
// Copyright (C) 2013 Inventures Software Ltd
//
// This file is part of Hatch.js
//
// Hatch.js is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, version 3
//
// Hatch.js is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE.
//
// See the GNU Affero General Public License for more details. You should have
// received a copy of the GNU General Public License along with Hatch.js. If
// not, see <http://www.gnu.org/licenses/>.
//
// Authors: Marcus Greenwood, Anatoliy Chakkaev and others

module.exports = DocSplit;

var cp = require('child_process');
var fs = require('fs');

/**
 * Wrapper for DocSplit by documentcloud.
 * Provides API for access to doc/pdf file contents and metadata.
 *
 * Read http://documentcloud.github.io/docsplit/ for installation notes
 */
function DocSplit(hatch) {
    this.hatch = hatch;
}

DocSplit.prototype.extractTitle = function(file, callback) {
    cp.exec('docsplit title "' + file + '"', function(err, stdout, stderr) {
        callback(err, stdout);
    });
};

DocSplit.prototype.extractText = function(file, callback) {
    console.log('docsplit text "' + file + '"')
    cp.exec('docsplit text "' + file + '"', function(err, stdout, stderr) {
        console.log(arguments)

        var textFile = file.substring(0, file.lastIndexOf('.')) + '.txt';
        fs.readFile(textFile, callback);
    });
};
