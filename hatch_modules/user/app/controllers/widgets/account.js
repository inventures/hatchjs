var _ = require('underscore');
var Widget = require(process.env.HATCH_WIDGETCONTROLLERPATH);

function AccountController(init) {
    Widget.call(this, init);
    init.before(initUser);
}

module.exports = AccountController;
require('util').inherits(AccountController, Widget);

function initUser(c) {
    c.locals.req = c.req;
    c.locals._ = _;

    c.locals.redirect = c.req.query.redirect;
    c.locals.mailTypes = [];//compound.mailer.getTypes();

    c.next();
}
