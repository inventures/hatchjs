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
//
var SetupController = require('./lib/controller.js');
var middleware = require('./lib/middleware');
var path = require('path');

module.exports = function (parent) {
    var s = parent.structure;
    s.register('controller', {name: 'setup', file: __dirname + '/lib/controller.js'});
    s.register('view', {name: 'setup/show', file: path.join(__dirname, 'views/setup.ejs')});

    process.nextTick(function () {
        parent.injectMiddlewareAfter('hatchMiddleware', middleware(parent));
    });
};
