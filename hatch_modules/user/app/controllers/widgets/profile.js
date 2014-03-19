var _ = require('underscore');
var Widget = require(process.env.HATCH_WIDGETCONTROLLERPATH);

function ProfileController(init) {
    Widget.call(this, init);
    init.before(initUser);
}

module.exports = ProfileController;
require('util').inherits(ProfileController, Widget);

function initUser(c) {
    c.locals.req = c.req;

    c.locals.user = c.req.selectedUser || c.req.user || new c.User();
    c.locals.user.isFollowed = _.find(c.req.user && c.req.user.ifollow || [], function(id) { return id == c.locals.user.id; });
    c.locals.profileFields = _.filter(c.req.group.profileFields, function(field) { return field.privacy == 'public'; });

    c.locals.numberOfFriends = (c.req.selectedUser && c.req.selectedUser.ifollow || []).length;

    if(c.req.selectedUser) {
        c.User.getFollowersOf(c.req.selectedUser.id, function(err, followers) {
            c.locals.numberOfFollowers = followers.length;

            c.Content.count({ authorId: c.req.selectedUser.id }, function(err, count) {
                c.locals.numberOfPosts = count;

                c.next();
            });
        });
    } else {
        c.locals.numberOfFollowers = 0;
        c.locals.numberOfPosts = 0;

        c.next();
    }
}

