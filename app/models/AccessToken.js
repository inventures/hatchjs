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

module.exports = function (compound, AccessToken) {
    var User = compound.models.User;

    /**
     * Load the auth token from the current request object and then load the
     * User attached to this token.
     * 
     * @param  {String} token - string representing access token.
     * @param  {Function} callback - called with (err, user).
     */
    AccessToken.loadUser = function (token, callback) {

        // if there is no token present, just continue
        if (!token) {
            callback(new Error('No access token given'));
        }

        AccessToken.findOne({where: {token: token }}, function (err, accessToken) {
            if (err) {
                callback(err);
            } else if (accessToken !== null && accessToken.userId !== undefined) {

                User.find(accessToken.userId, function (err, user) {
                    if (err) {
                        return callback(err);
                    }
                    // validate the token
                    if (!user) {
                        console.log('User in access token ' + accessToken.id + ' not found');
                        return callback();
                    }
                    if (!accessToken.isTokenValid()) {
                        console.log('Access token ' + accessToken.id + ' was invalid');
                        return callback();
                    }

                    callback(null, user);
                });
            }
            else {
                callback();
            }
        });
    };

    /**
     * Returns whether this token is still valid for use.
     * 
     * @return {Boolean}
     */
    AccessToken.prototype.isTokenValid = function () {
        return !this.expiryDate || this.expiryDate > new Date();
    };

    /**
     * Generate a new token for the specified user/client and save to the 
     * database and return via callback.
     *
     * @param  {Number}   userId        - Id of the user
     * @param  {Number}   clientId      - Id of the client application
     * @param  {Object}   scope         - scope of access
     * @param  {Date}     expiryDate    - expiry date for this token (optional)
     * @param  {Function} callback      - callback function
     */
    AccessToken.generateToken = function (userId, clientId, scope, expiryDate, callback) {
        var token = new AccessToken();
        
        token.userId = userId;
        token.clientId = clientId;
        token.scope = JSON.parse(scope || '{}');
        token.expiryDate = expiryDate;
        token.token = compound.hatch.crypto.generateRandomString(256);

        token.save(callback);
    };
};
