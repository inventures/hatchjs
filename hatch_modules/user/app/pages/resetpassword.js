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

exports.defaultPath = 'reset-password/:token';

exports.defaultPage = {
    title: 'Reset password',
    grid: '01-one-column',
    columns: [{size: 12, widgets: [1, 2]}, {size: 12, widgets: [3]}],
    widgets: [
        {id: 1, type: 'core-widgets/group-header'},
        {id: 2, type: 'core-widgets/mainmenu'},
        {id: 3, type: 'user/resetpassword', settings: { title: 'Reset password'}}
    ]
};

exports.handler = function (env, done) {
    console.log('CALLED HANDLER');
    // get the reset password
    var token = env.req.specialPageParams && env.req.specialPageParams.token || env.req.query && env.req.query.token;

    if (token) {
        env.ResetPassword.findOne({ where: { token: token }}, function(err, rp) {
            // get the user
            if (rp) {
                env.User.findOne({ where: { id: rp.userId }}, function(err, user) {
                    env.req.user = user;
                    env.req.params.token = token;

                    done();
                })
            }
            // do nothing - invalid password reset token
            else {
                done();
            }
        });
    } else {
        done();
    }
};

exports.interface = {
    'selectedUser': 'User'
};
