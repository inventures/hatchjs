var Widget = require(process.env.HATCH_WIDGETCONTROLLERPATH);

function HtmlController(init) {
    Widget.call(this, init);
}

module.exports = HtmlController;
require('util').inherits(HtmlController, Widget);

/**
 * Show this widget.
 * 
 * @param  {HttpContext} c - context
 */
HtmlController.prototype.show = function (c) {
    c.locals.inlineEditAllowed = true;
    c.render({ layout: 'widgets' });
};

/**
 * Configure the settings for this widget.
 * 
 * @param  {HttpContext} c - context
 */
HtmlController.prototype.configure = function (c) {
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
HtmlController.prototype.update = function (c) {
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