function ContentController(init) {
	init.before(findPost, { except: ['deleteComment', 'comments'] });
}

module.exports = ContentController;

function findPost (c) {
	var id = c.req.param('id');

	c.Content.find(id, function (err, post) {
		if (err) {
			return c.sendError(err);
		}
		if (!post) {
			return c.sendError('Post not found');
		}

		c.req.post = c.locals.post = post;
		c.next();
	});
}

ContentController.prototype.render = function (c) {
	c.locals.type = c.req.param('type');

	c.locals.post.doesUserLike(c.req.user.id, function (err, doesLike) {
		c.locals.post.doesLike = doesLike;
		c.render({ layout: false });
	});
};

ContentController.prototype.comments = function (c) {
	var query = {
		where: {
			contentId: c.req.param('contentId')
		},
		offset: c.req.param('offset'),
		limit: c.req.param('limit')
	};
	c.Comment.all(query, function (err, comments) {
		c.Content.populateUsers(comments, function (err, comments) {
			c.locals.comments = comments;
			c.render({ layout: false });
		});
	});
};

ContentController.prototype.like = function (c) {
	if (!c.req.user) {
		c.res.statusCode = 400;
		return c.res.send({ 
			error: 'You must be logged in to do that' 
		});
	}

	c.req.post.like(c.req.user.id, function (err, post, doesLike) {
		post.doesLike = doesLike;
		c.send({
			status: 'success',
			post: post,
			message: doesLike ? 'Post liked':'Post unliked'
		});
	});
};

ContentController.prototype.comment = function (c) {
	if (!c.req.user) {
		c.res.statusCode = 400;
		return c.send({ 
			error: 'You must be logged in to do that' 
		});
	}

	c.req.post.postComment(c.req.user.id, c.req.body.text, function (err, comment) {
		c.send({
			status: 'success',
			comment: comment,
			message: 'Comment posted!'
		});
	});
};

ContentController.prototype.deleteComment = function (c) {
	if (!c.req.user) {
		c.res.statusCode = 400;
		return c.send({ 
			error: 'You must be logged in to do that' 
		});
	}

	var id = c.req.param('id');

	c.Comment.find(id, function (err, comment) {
		if (comment.authorId !== c.req.user.id) {
			return c.sendError('Permission denied');
		}

		comment.destroy(function (err) {
			if (err) {
				return c.sendError(err);
			}

			c.send({
				status: 'success',
				comment: comment
			});
		});
	});
};