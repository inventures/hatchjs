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

var crypto = require('crypto');

module.exports = function(compound, ResetPassword) {
    var User = compound.models.User;

    ResetPassword.belongsTo(User, {as: 'user', foreignKey: 'userId'});
    ResetPassword.TOKEN_EXPIRATION_LIMIT = 86400000; // one day

    ResetPassword.upgrade = function (user, cb) {
        ResetPassword.findOne({where: {userId: user.id}}, function (err, rp) {
            if (err) return cb(err);
            if (rp) return rp.updateToken(cb);
            rp = new ResetPassword;
            rp.userId = user.id;
            rp.generateToken();
            rp.createdAt = new Date();
            rp.save(function (err) {
                cb(err, err ? null : rp);
            });
        });
    };

    ResetPassword.prototype.updateToken = function updateToken(cb) {
        this.generateToken();
        this.createdAt = new Date();
        this.save(cb);
    };

    ResetPassword.prototype.generateToken = function generateToken() {
        this.token = crypto.createHash('sha1').update(Math.random().toString()).digest('hex');
    };

    ResetPassword.auth = function (token, cb) {
        ResetPassword.findOne({ where: { token: token }}, function (err, rp) {
            if (err) return cb(err);
            if (!rp) {
                return cb(new Error('User not found'));
            }
            if ((Date.now() - new Date(rp.createdAt)) > ResetPassword.TOKEN_EXPIRATION_LIMIT) {
                return cb(new Error('Token expired'));
            }

            User.findOne({ where: { id: rp.userId }}, function(err, user) {
                cb(null, user);
            })
        });
    };

    ResetPassword.prototype.changePassword = function(token, password, cb) {
        if (!password) {
            return cb(new Error('Password required'));
        }
        if (!token) {
            return cb(new Error('Token required'));
        }
        ResetPassword.auth(token, function (err, user) {
            if (err || !user) {
                return cb(err || new Error('Token invalid or expired'));
            }
            user.updateAttribute('password', password, cb);
        });
    };

};
