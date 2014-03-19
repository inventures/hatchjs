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

'use strict';

var _ = require('underscore');

module.exports = ContentTypeAPI;

function ContentTypeAPI(hatch) {
    this.hatch = hatch;
    this.registry = {};
    this.contentTypes = [];
}

/**
 * Register a new content type.
 * 
 * @param  {String} name   - name of content type
 * @param  {Object} params - contentType constructor params
 */
ContentTypeAPI.prototype.registerContentType = function (name, params) {
    var self = this;

    if (typeof params === 'string') {
        params = {
            view: params
        };
    }

    if (!params.name) {
        params.name = name;
    }

    // remove existing content type (if any)
    this.contentTypes = _.reject(this.contentTypes, function (type) {
        return type.name === params.name;
    });

    this.registry[name] = params;
    this.contentTypes.push(params);

    if (params.editForm || params.view || params.thumb) {
        self.hatch.compound.on('ready', function () {
            // register edit form
            if (params.editForm) {
                self.hatch.compound.structure.views['content/edit/' + params.name] = params.editForm;
            }

            // register view template
            if (params.view) {
                self.hatch.compound.structure.views['content/' + params.name] = params.view;
            }

            // register thumbnail template
            if (params.thumb) {
                self.hatch.compound.structure.views['content/thumb/' + params.name] = params.thumb;
            }
        });
    }
};

/**
 * Get the contentTemplate for the specified content type.
 * 
 * @param  {String} name - content type name
 * @return {String}      - content type view template path
 */
ContentTypeAPI.prototype.getContentTemplate = function (name) {
    return this.registry[name].view;
};

/**
 * Get a content type definition.
 * 
 * @param  {String} name - content type name
 * @return {Object}      - content type definition
 */
ContentTypeAPI.prototype.getContentType = function (name) {
    return this.registry[name];
};

/**
 * Get the edit form for a content type.
 * 
 * @param  {String} name - content type name
 * @return {String}      - edit form view location
 */
ContentTypeAPI.prototype.getEditForm = function (name) {
    return (this.registry[name] || {}).editForm;
};

/**
 * Get all of the editable content types.
 * 
 * @return {Array} - list of editable content types
 */
ContentTypeAPI.prototype.getEditable = function () {
    return this.contentTypes.filter(function (contentType) { 
        return contentType.editForm != null; 
    });
};

/**
 * Get all of the content types.
 * 
 * @return {Array} - list of content types
 */
ContentTypeAPI.prototype.getAll = function () {
    return this.contentTypes;
};
