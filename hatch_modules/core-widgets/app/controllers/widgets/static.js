var Widget = require(process.env.HATCH_WIDGETCONTROLLERPATH);

function StaticController(init) {
    Widget.call(this, init);
}

module.exports = StaticController;
require('util').inherits(StaticController, Widget);

/**
 * Show this widget.
 * 
 * @param  {HttpContext} c - context
 */
StaticController.prototype.show = function (c) {
    c.locals.inlineEditAllowed = true;
    c.render({ layout: 'widgets' });
};

/**
 * Configure the settings for this widget.
 * 
 * @param  {HttpContext} c - context
 */
StaticController.prototype.configure = function (c) {
    // don't override the HTML content
    if (!c.req.body.content) {
        c.req.body.content = c.locals.widget.settings.content;
    }

    c.locals.widget.settings = c.req.body;
    c.locals.widget.save(function (err) {
        if (err) {
            return c.send(err);
        }

        c.send({
            status: 'success',
            message: 'Widget settings saved',
            widget: c.locals.widget
        });
    });
};

/**
 * Update the HTML content for this widget.
 * 
 * @param  {HttpContext} c - context
 */
StaticController.prototype.update = function (c) {
    c.locals.widget.settings.content = c.req.body.content;
    c.locals.widget.save(function (err) {
        if (err) {
            return c.send(err);
        }

        c.send({
            status: 'success',
            message: 'Widget content saved',
            widget: c.locals.widget
        });
    });
};