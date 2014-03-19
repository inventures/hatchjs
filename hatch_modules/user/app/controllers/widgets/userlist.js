var _ = require('underscore');
var Widget = require(process.env.HATCH_WIDGETCONTROLLERPATH);

function UserListController(init) {
    Widget.call(this, init);
    init.before(setupUsers);
}

module.exports = UserListController;
require('util').inherits(UserListController, Widget);

function setupUsers(c) {
    var cond = {};

    var page = parseInt(c.req.query.page || 1);
    var pageSize = parseInt(c.locals.widget.settings.pageSize || 10);

    var limit = pageSize;
    var offset = pageSize * (page -1);

    var query = {
        where: cond,
        limit: limit,
        offset: offset,
        order: c.req.group.id + ':membership:joinedAt DESC',
        fulltext: c.req.param('query')
    };

    // use the selected user or current user
    var user = c.req.selectedUser || c.req.user;

    // a-z index
    if(c.req.query.letter) {
        cond.lastnameLetter = c.req.query.letter;
    }

    // filter by tags
    if (this.widget.settings.tags) {
        cond.tags = this.widget.settings.tags;
    }

    // build the query condition
    switch(this.widget.settings.displayMode) {
        case 'followers':
            if(user) {
                c.User.getFollowersOf(user.id, function(err, ids) {
                    cond.id = ids;
                    runQuery(cond);
                });

                return;
            }
            break;
        case 'following':
            if(user) {
                cond.id = user.ifollow;
            }
            break;
        case 'members':
            // standard: get the list of users for this group
            cond.membershipGroupId = c.req.group.id;
    }

    runQuery(cond);

    function runQuery(cond) {
        c.locals.profileFields = c.locals._.filter(c.req.group.profileFields, function(field) { return field.privacy === 'public'; });

        // check for invalid query condition
        if(Object.keys(cond).length === 0 || (typeof cond.id != 'undefined' && (cond.id === null || cond.id.length === 0))) {
            c.locals.letter = c.req.query.letter;
            c.locals.users = [];
            c.locals.pagination = { page: 1, size: pageSize, count: 0 };

            return c.next();
        }

        c.User.all(query, function (err, users) {
            // get whether the current user is following each one
            users.forEach(function(user) { user.isFollowed = _.find(c.req.user && c.req.user.ifollow || [], function(id) { return id == user.id; }); });

            c.locals.letter = c.req.query.letter;
            c.locals.pagination = { page: page, size: pageSize, count: users.countBeforeLimit };
            c.locals.users = users;
            c.locals.req = c.req;

            c.next();
        });
    }
}

