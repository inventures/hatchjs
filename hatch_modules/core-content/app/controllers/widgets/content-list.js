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

function ContentListController(init) {
    Widget.call(this, init);
}

module.exports = ContentListController;
require('util').inherits(ContentListController, Widget);

ContentListController.prototype.show = function (c) {
	var widget = c.locals.widget;
	var offset = c.req.param('offset');
	var limit = c.req.param('limit');

	// default filter is by group.id
	var cond = {
		groupId: c.req.group.id
	};

	// filter by profile user
	if (c.req.selectedUser) {
		cond = {
			authorId: c.req.selectedUser.id
		};
	}

	// filter by tags
	if (widget.settings.tags) {
		cond = {
			tags: widget.settings.tags
		};
	}

	// filter by contentType
	if (widget.settings.contentType) {
		cond.type = widget.settings.contentType;
	}

	var query = {
		limit: limit || widget.settings.pageSize,
		offset: offset || widget.settings.startAt || 0,
		where: cond
	};

	c.Content.allWithLikes(query, c.req.user, function (err, posts) {
		c.locals.posts = posts;
		c.locals.count = posts.countBeforeLimit;
		c.locals.offset = parseInt(query.offset);
		c.locals.limit = parseInt(query.limit);

		c.render({ layout: c.req.query.offset ? null : 'widgets' });
	});
};
