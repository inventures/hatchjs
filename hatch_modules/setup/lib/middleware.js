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

module.exports = function hatchSetup(compound) {
    return function (req, res, next) {
        // just continue if we find a group
        if (req.group) {
            return next();
        }

        var Group = compound.models.Group;

        // check to see if any groups have been created
        Group.all({limit: 1}, function(err, groups) {

            if (groups.length > 0) {
                return next();
            }

            if (req.method == 'POST') {
                if (req.query.qqfile) {
                    call('upload');
                } else if (req.body.dataFilename) {
                    call('import');
                } else {
                    call('setup');
                }
            } else {
                call('show');
            }
        });

        function call(action) {
            compound.controllerBridge.callControllerAction(
                'setup', action, req, res, next);
        }

    }
};
