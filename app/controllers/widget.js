'use strict';

var _ = require('underscore');

/**
 * Instantiate a new widget controller.
 * 
 * @param {Context} init - initialiser context object
 */
function WidgetController(init) {
	init.before(initEnv);
}

module.exports = WidgetController;

// default initialiser for widget controllers
function initEnv(c) {
    c.locals._ = _;
    c.locals.group = c.req.group;
    c.locals.user = c.req.user;
    c.req.data = c.req.body.data;
    c.locals.data = c.req.data && c.req.data.data;
    c.locals.canEdit = c.req.user && c.req.group && c.req.user.adminOf(c.req.group);
    c.locals.inlineEditAllowed = false;

    // skip the rest of initialisation if we already know the page
    if (c.locals.page) {
        return c.next();
    }

    c.locals.group.definePage(c.req.pagePath, c, function (err, page) {
        if (err || !page) {
            return c.send('Widget not found');
        }

        c.locals.page = page;
        var wc = c.req.body.data.templateWidget ? 'templateWidgets' : 'widgets';
        var id = parseInt(c.req.body.data.widgetId, 10);
        c.locals.widget = page[wc].find(id, 'id');

        if (c.locals.widget) {
            c.locals.widget.settings = c.locals.widget.settings || {};
        }

        // fix the body data to be used by the controller action
        c.req.body = c.locals.data;
        c.next();
    });
}

/**
 * Default render action.
 * 
 * @param  {HttpContext} c - context
 */
WidgetController.prototype.show = function (c) {
	c.render({ layout: 'widgets' });
};

/**
 * Configure the settings for the widget.
 * 
 * @param  {HttpContext} c - context
 */
WidgetController.prototype.configure = function (c) {
    c.locals.widget.settings = c.req.body;
    c.locals.widget.save(function (err) {
        if (err) {
            return c.sendError(err);
        }

        c.send({
            status: 'success',
            message: 'Widget settings saved',
            widget: c.locals.widget
        });
    });
};

/**
 * Set the title of a widget.
 *
 * @param  {ControllerContext} c - compound controller context
 */
WidgetController.prototype.settitle = function(c) {
    c.locals.widget.settings.title = c.req.body.title;
    c.locals.widget.save(function () {
        c.send({
            status: 'success',
            message: 'Widget title updated',
            widget: c.locals.widget
        });
    });
};

/**
 * Adjust the contrast of a widget on the page.
 *
 * @param  {ControllerContext} c - compound controller context
 */
WidgetController.prototype.contrast = function(c) {
    var modes = 2;
    var settings = c.locals.widget.settings;

    settings.contrastMode = (settings.contrastMode || 0) +1;

    if (settings.contrastMode > modes) {
        settings.contrastMode = 0;
    }

    c.locals.widget.save(function() {
        c.send({
            status: 'success',
            message: 'Widget contrast mode set to ' + settings.contrastMode,
            widget: c.locals.widget
        });
    });
};
