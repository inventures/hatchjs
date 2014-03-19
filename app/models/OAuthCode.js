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

module.exports = function (compound, OAuthCode) {
    var OAuthClient = compound.models.OAuthClient;
    var AccessToken = compound.models.AccessToken;

    /**
     * Generate a new OAuthCode with which to grant an application access to
     * perform actions on a user's behalf.
     * 
     * @param  {String}   apiKey      - API Key for the OAuthClient / consumer
     * @param  {Number}   userId      - id of the user for this OAuthCode
     * @param  {String}   redirectUri - URL to redirect to on successful grant
     * @param  {Object}   scope       - scope of the access - e.g. edit, save (optional)
     * @param  {Date}     expiryDate  - expiryDate (optional)
     * @param  {String}   state       - state / CSRF token (optional)
     * @param  {Function} callback    - callback function
     */
    OAuthCode.generate = function (apiKey, userId, redirectUri, scope, expiryDate, state, callback) {
        OAuthClient.findByApiKey(apiKey, function (err, client) {
            if (!client) {
                return callback(new Error('Invalid API Key'));
            }

            // check the redirectUri is allowed
            if (redirectUri && redirectUri.indexOf(client.redirectUri) === -1) {
                return callback(new Error('Invalid redirectUri'));
            }

            var code = new OAuthCode();

            code.userId = userId;
            code.clientId = client.id;
            code.redirectUri = redirectUri || client.redirectUri;
            code.scope = scope;
            code.expiryDate = expiryDate;
            code.code = compound.hatch.crypto.generateRandomString(256);
            code.state = state;

            code.save(callback);
        });
    };

    /**
     * Find an OAuthCode by it's code.
     * 
     * @param  {String}   code     - code to look for
     * @param  {Function} callback - callback function
     */
    OAuthCode.findByCode = function (code, callback) {
        OAuthCode.findOne({ where: { code: code }}, callback);
    };

    /**
     * Exchange an OAuthCode for an AccessToken. This will check the apiSecret 
     * vs the apiSecret stored in the OAuthClient record and throw an error if
     * they are not the same.
     *
     * @param  {String}   apiKey    - apiKey for OAuthClient
     * @param  {String}   apiSecret - apiSecret for OAuthClient
     * @param  {Function} callback  - callback function
     */
    OAuthCode.prototype.exchange = function (apiKey, apiSecret, callback) {
        var code = this;

        // validate expired code
        if (code.expiryDate && code.expiryDate < new Date()) {
            return callback(new Error('OAuthCode has expired'));
        }

        OAuthClient.find(code.clientId, function (err, client) {
            // validate the apiKey
            if (client.apiKey !== apiKey) {
                return callback(new Error('ApiKey does not match'));
            }

            // authenticate using the apiSecret
            if (client.apiSecret !== apiSecret) {
                return callback(new Error('ApiSecret does not match'));
            }

            // generate a new AccessToken and return
            AccessToken.generateToken(code.userId, code.clientId, code.scope, code.expiryDate, function (err, token) {
                if (err) {
                    callback (err, token);
                } else {
                    // delete the code - we don't need it anymore
                    code.destroy();
                    callback (err, token);
                }
            });
        });
    };
};