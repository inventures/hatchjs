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

var compound = require('compound');

module.exports = function (c) {
    var contentTypes = {
        statusupdate: {
            icon: 'user',
            view: __dirname + '/content/statusupdate.ejs',
            editForm: __dirname + '/content/statusupdate-form.ejs'
        }
    };

    Object.keys(contentTypes).forEach(function (key) {
        var type = contentTypes[key];
        c.hatch.contentType.registerContentType(key, type);
        c.hatch.page.register(key, require('./specials/' + key));
    });
    
    return compound.createServer({root: __dirname});
};
