exports.routes = function (map) {
	map.get(':id/render', 'content#render', {as: 'render'});
	map.get(':contentId/comments', 'content#comments', {as: 'loadComments'});
	map.post(':id/like', 'content#like', {as: 'like'});
	map.post(':id/comment', 'content#comment', {as: 'comment'});
	map.del('comment/:id/delete', 'content#deleteComment', {as: 'deleteComment'});
};