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

exports.defaultPath = 'profile/:username';

exports.defaultPage = {
    title: 'User profile',
    grid: '03-three-columns',
    type: 'profile',
    columns: [{size: 12, widgets: [1, 2]}, {size: 3, widgets: [3]}, {size: 6, widgets: [6]}, {size: 3, widgets: [4, 5]}],
    widgets: [
        {id: 1, type: 'core-widgets/group-header'},
        {id: 2, type: 'core-widgets/mainmenu'},
        {id: 3, type: 'user/profile'},
        {id: 4, type: 'user/userlist', settings: { title: 'Following', displayType: 'thumbnails', displayMode: 'following', pageSize: 10}},
        {id: 5, type: 'user/userlist', settings: { title: 'Followers', displayType: 'thumbnails', displayMode: 'followers', pageSize: 10}},
        {id: 6, type: 'core-content/content-list', settings: { title: '', pageSize: 10 }}
    ]
};

exports.handler = function (env, done) {
    var username = env.req.specialPageParams &&
    env.req.specialPageParams.username || env.req.query.username;
    if (username) {
        env.User.all({
            where: { username: username }
        }, function (err, users) {
            if (err || !users || !users[0]) {
                return env.next(new env.errors.NotFound(env.req, 'Profile not found'));
            } else {
                env.req.selectedUser = users[0];
                done();
            }
        });
    } else {
        env.req.selectedUser = env.req.user;
        done();
    }
};

exports.interface = {
    'selectedUser': 'User'
};

exports.params = {
    username: { required: false }
};

