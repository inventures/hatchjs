module.exports = RelationshipController;

// TODO: rid of _
var _ = require('underscore');

function RelationshipController(init) {
    init.before(function loadUser(c) {
        c.User.find(c.params.id, function(err, user) {
            c.locals.user = user;
            c.next();
        });
    });
}

RelationshipController.prototype.follow = function(c) {
    c.req.user.followUser(c.locals.user.id, function() {
        // TODO: move to model
        c.req.user.isFollowed = _.find(user && user.ifollow || [],
            function(id) { return id == c.req.user.id; });

        // TODO: move to model
        // send an email notification and generate the notification
        user.notify('follow', _.extend({
            followUser: c.req.user
        }, c.viewContext));

        c.send({
            message: 'You are now following ' + user.displayName,
            status: 'success'
        });
    });
};

//unfollow a user
RelationshipController.prototype.unfollow = function(c) {
    c.req.user.unfollowUser(c.locals.user.id, function() {
        c.send({
            message: 'You are no longer following ' + user.displayName,
            icon: 'info-sign',
            status: 'success'
        });
    });
};
