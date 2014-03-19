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

var Widget = require(process.env.HATCH_WIDGETCONTROLLERPATH);

function StatusUpdateFormController(init) {
    Widget.call(this, init);
}

module.exports = StatusUpdateFormController;
require('util').inherits(StatusUpdateFormController, Widget);

StatusUpdateFormController.prototype.show = function (c) {
	c.render({ layout: 'widgets' });
};

StatusUpdateFormController.prototype.post = function (c) {
	if (!c.req.user) {
		return c.send({ 
			code: 400, 
			error: 'You must be logged in to do that' 
		});
	}

	var data = {
		createdAt: new Date(),
		type: 'statusupdate',
		text: c.req.body.text,
		authorId: c.req.user.id,
		groupId: c.req.group.id,
		tags: c.locals.widget.settings.tags
	};

	c.Tag.assignTagsForObject(data, data.tags, function () {
		c.Content.create(data, function (err, post) {
			if (err) {
				return c.send({
					code: 400,
					error: post.errors
				});
			}

			c.send({
				status: 'success',
				post: post
			});
		});
	});
};