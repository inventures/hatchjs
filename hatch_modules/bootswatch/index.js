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
var path = require('path');

module.exports = function (c) {
    // register the default themes
    var themes = [];

    var bootswatchDir = path.join(__dirname, '../../bower_components/bootswatch');
    var themeDirs = fs.readdirSync(bootswatchDir);

    themeDirs.forEach(function (dir) {
        var themeDir = path.join(bootswatchDir, dir);
        
        if (fs.existsSync(themeDir + '/bootswatch.less') && fs.existsSync(themeDir + '/variables.less')) {
            themes.push(dir);
        }
    });

    themes.forEach(function (name) {
        // ignore custom - it is not a valid bootswatch theme
        if (name === 'custom') {
            return;
        }
        c.hatch.themes.registerTheme({ title: name.substring(0, 1).toUpperCase() + name.substring(1), name: name.toLowerCase() });
    });

    return compound.createServer({root: __dirname});
};
