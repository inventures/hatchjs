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

var ejs = require('ejs');

module.exports = NotificationAPI;

function NotificationAPI(hatch) {
    this.hatch = hatch;
    this.templates = {};
};

var templates = {};

/**
 * Register a new notification type
 *
 * @param type - name of the notification type
 * @param path - path to the notification template
 */
NotificationAPI.prototype.registerNotification = function (type, path) {
    this.templates[type] = { path: path };
};

/**
 * Check whether a notification type exists
 *
 * @param type - name of notification type
 * @return {Boolean}
 */
NotificationAPI.prototype.isDefined = function(type) {
    return typeof this.templates[type] != 'undefined';
};

/**
 * Create a notification and sends to the recipient user
 *
 * @param {String} type - notification type name
 * @param {User} recipient - recipient of notification
 * @param {Object} locals - {key: data} locals data for notification
 * @param {Function} cb - callback function
 *
 * TODO: test and make it working on any templating engine
 */
NotificationAPI.prototype.create = function (type, recipient, locals, cb) {
    var NotificationAPI = this.hatch.compound.models.Notification;

    // get the recipient
    var recipientId = recipient.id || recipient;

    // get the template
    var notification = this.templates[type];
    if (!notification) throw new Error('Notification type "' + type + '" is not registered!');

    var path = notification.path + '.ejs';
    var html = '';
    var url = null;

    // render the notification with the registered template
    ejs.renderFile(path, {locals: locals}, function (err, res) {
        if(err) console.log(err);
        html = res;

        // create the notification object
        Notification.createNotification(recipientId, url, html, cb);
    });
};
