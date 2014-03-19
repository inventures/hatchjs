var Widget = require(process.env.HATCH_WIDGETCONTROLLERPATH);

function GroupHeaderController(init) {
    Widget.call(this, init);
}

module.exports = GroupHeaderController;
require('util').inherits(GroupHeaderController, Widget);

/**
 * Show this widget.
 * 
 * @param  {HttpContext} c - context
 */
GroupHeaderController.prototype.show = function (c) {
	c.locals.inlineEditAllowed = true;
    c.render({ layout: 'widgets' });
};

/**
 * Update the HTML header for the group.
 * 
 * @param  {HttpContext} c - context
 */
GroupHeaderController.prototype.update = function (c) {
    c.req.group.headerHtml = c.req.body.content;
    c.locals.group.save(function (err) {
        if (err) {
            return c.send(err);
        }

        c.send('ok');
    });
};