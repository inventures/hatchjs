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

var crypto = require('crypto');

module.exports = CryptoAPI;

function CryptoAPI(hatch) {
    this.hatch = hatch;
}

/**
 * Calculate the SHA256 hash of the specified text payload. The length of the 
 * returned text will always be 64 characters.
 * 
 * @param  {String} payload - text to hash
 * @return {String}         - text hash
 */
CryptoAPI.prototype.calcSha = function (payload) {
    if (!payload) {
        return '';
    }
    if (payload.length === 64) {
        return payload;
    }
    return crypto.createHash('sha256').update(payload).update(this.hatch.app.config.passwordSalt || '').digest('hex');
};

/**
 * Generate a random string of the specified length. Will only use A-Za-z0-9.
 * 
 * @param  {String} length - length of the random string you require
 * @return {[type]}        - random string of the specified length
 */
CryptoAPI.prototype.generateRandomString = function (length) {
    var str = '';
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i=0; i<length; i++) {
        str += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return str;
};