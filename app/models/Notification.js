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

module.exports = function (compound, Notification) {
    var api = compound.hatch.api;

    /**
     * creates a new notification and saves to db
     * 
     * @param  {[Number]}   userId   [id of user to whom this notification is sent]
     * @param  {[String]}   url      [url]
     * @param  {[String]}   html     [notification contents html]
     * @param  {Function}   callback [continuation function]
     */
    Notification.createNotification = function(userId, url, html, callback) {
        var data = {
            userId: userId,
            createdAt: new Date(),
            isRead: false,
            url: url,
            html: html
        };

        // save to database, send to socket and callback
        Notification.create(data, function(err, notification) {
            // send to socket
            api.socket.send('user:' + userId, 'notification', {
                notificationId: notification.id
            });

            if(callback) callback();
        });
    };

};
