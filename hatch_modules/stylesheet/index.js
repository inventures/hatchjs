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

var compound = require('compound');
var fs = require('fs');
var fsTools = require('fs-tools');

module.exports = function (c) {
    // register the default bootstrap theme
    c.hatch.themes.registerTheme({
        title: 'Bootstrap',
        name: 'bootstrap',
        thumbnail: '/images/bootstrap-thumbnail.png',
        variables: '/bootstrap/less/variables.less',
        bootswatch: '/less/bootswatch-blank.less'
    });

    // set the default - for new groups with no theme defined
    c.hatch.themes.registerDefaultTheme('bootstrap');

    process.nextTick(function () {
        c.models.Stylesheet.lastUpdate = new Date();
    });

    // this is a bit of a hack to make sure the font awesome fonts exist when
    // css is being written to file system in production mode
    // copy font awesome fonts if they do not already exist
    var fontRoot = __dirname + '/../../public/fonts';
    var fontAwesome = __dirname + '/../../bower_components/font-awesome/fonts';

    fs.readdir(fontAwesome, function (err, files) {
        if (files)
        files.forEach(function (file) {
            if (!fs.existsSync(fontRoot + '/' + file)) {
                fsTools.copy(fontAwesome + '/' + file, fontRoot + '/' + file,
                    function () { });
            }
        });
    });

    return compound.createServer({root: __dirname});
};
