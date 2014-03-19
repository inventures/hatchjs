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

/**
 * URI.js automatically adds an auto-generated 'uri' to all database entities.
 * This can be used to reference the original entity which may have been 
 * imported from another Hatch application instance.
 */
module.exports = function (compound) {
    process.nextTick(function () {
        Object.keys(compound.models).forEach(function (modelName) {
            var model = compound.models[modelName];
            if (!model.schema) {
                return;
            }
            
            var schema = model.schema.definitions[modelName];
            var hq = model.schema.adapter
            var redis = model.schema.adapter.client;

            //add the uri property to each schema
            schema.properties.uri = { type: String, index: true };

            //generate the uri value whenever an object is saved
            var beforeSave = model.beforeSave;
            model.beforeSave = function (done, obj) {
                var self = this;

                if (obj.uri) {
                    next();
                } else if (self.id) {
                    self.uri = obj.uri = generateUri(self.id);
                    next();
                } else {
                    redis.get('id:' + hq.modelName(modelName), function (err, id) {
                        self.uri = obj.uri = generateUri(parseInt(id || 0, 10) + 1);
                        next();
                    });
                }

                function next() {
                    if (beforeSave) {
                        beforeSave.call(self, done, obj);
                    } else {
                        done();
                    }
                }
            };

            function generateUri(id) {
                return '/do/api/' + modelName.toLowerCase() + '/' + id;
            }
        });
    });
};