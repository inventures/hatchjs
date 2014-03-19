var Widget = require(process.env.HATCH_WIDGETCONTROLLERPATH);

function ResetPasswordController(init) {
    Widget.call(this, init);
    init.before(initUser);
}

module.exports = ResetPasswordController;
require('util').inherits(ResetPasswordController, Widget);

function initUser(c) {
    c.locals.user = c.req.selectedUser || c.req.user;
    c.locals.token = c.req.params.token;

    c.next();
}

