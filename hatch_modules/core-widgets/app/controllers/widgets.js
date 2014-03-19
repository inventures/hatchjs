//
// Hatch.js is a CMS and social website building framework built in Node.js 
// Copyright (C) 2013 Inventures Software Ltd
//
// This file is part of Hatch.js
//
// Hatch.js is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, version 3
//
// Hatch.js is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE.
//
// See the GNU Affero General Public License for more details. You should have
// received a copy of the GNU General Public License along with Hatch.js. If
// not, see <http://www.gnu.org/licenses/>.
//
// Authors: Marcus Greenwood, Anatoliy Chakkaev and others
//

var _ = require('underscore');

module.exports = WidgetController;

function WidgetController(init) {
    init.before(findPageAndWidget);
    init.before(requireAdmin, {only: ['create', 'configure', 'update', 'destroy', 'settitle', 'contrast' ] });
}

// make sure the admin user is logged in
function requireAdmin(c) {
    if (c.canEdit) {
        c.next();
    } else {
        c.next(new c.errors.Forbidden('admin required'));
    }
}

// finds the page that we are performing the action on
function findPageAndWidget(c) {
    var self = this;
    var widgetId = parseInt((c.req.body.data && c.req.body.data.widgetId) || c.req.params.widgetId || c.req.params.id, 10);
    c.req.group.definePage(c.req.pagePath, c, function (err, page) {
        self.page = c.req.page = page;
        c.canEdit = c.req.user && c.req.user.adminOf(c.req.group);
        if (widgetId) {
            self.widget = page.widgets.find(widgetId, 'id');
            if (!self.widget.settings) self.widget.settings = {};
        }
        c.locals.canEdit = c.req.user && c.req.group && c.req.user.adminOf(c.req.group);
        c.next();
    });
}

/**
 * Wildcard handler for widget actions.
 *
 * @param  {ControllerContext} c - compound controller context
 */
WidgetController.prototype.__missingAction = function __missingAction(c) {
    //this.page.widgetAction(this.widget.id, c.requestedActionName, c.req.body, c.req, function (err, res) {
    try {
        this.page.renderWidgetAction(c.req, this.widget, c.requestedActionName.replace('.json', ''), c.req.body, function (err, res) {
            if (typeof res === 'string') {
                c.send(res);
            } else if (res.error) {
                c.res.status(res.code);
                c.send(res);
            } else {
                c.send(res);
            }
        });
    } catch(err) {
        console.log(err);
        c.send(err);
    }
};

/**
 * Add a new widget to the current page.
 *
 * @param  {ControllerContext} c - compound controller context
 */
WidgetController.prototype.create = function(c) {
    var page = this.page;
    var type = c.body.addWidget;
    
    // get the widget definition
    var widgetDefinition = c.compound.hatch.widget.getWidget(type);
    var settings = {
        title: widgetDefinition.info.title
    };

    if (widgetDefinition.info.settings) {
        // set the default settings values
        Object.keys(widgetDefinition.info.settings.fields).forEach(function (key) {
            var field = widgetDefinition.info.settings.fields[key];
            if (field.default) {
                settings[key] = field.default;
            }
        });
    }

    // add to the page
    var widget = page.widgets.push({
        type: type,
        settings: settings
    });

    // save the new widget, render and add to the page
    page.save(function (err) {
        if (err) {
            return c.sendError(err);
        }

        page.renderWidgetAction(c.req, widget, 'show', {}, function (err, html) {
            c.send({
                code: err ? 500 : 200,
                html: html,
                widget: widget,
                error: err
            });
        });
    });
};

/**
 * Remove a widget from the page.
 * 
 * @param  {HttpContext} c - http context
 */
WidgetController.prototype.remove = function (c) {
    var page = this.page;
    page.removeWidget(c.req.params.widgetId, function (err) {
        if (err) {
            return c.sendError(err);
        }

        c.send({
            status: 'success',
            message: 'widget removed successfully'
        });
    });
};

/**
 * Render a widget
 * //TODO: move this to core lib
 *
 * @param  {ControllerContext} c - compound controller context
 */
WidgetController.prototype.render = function(c) {
    this.page.renderWidgetAction(c.req, this.widget, function (err, html) {
        c.send(html);
    });
};

/**
 * Update a widget by performing the update action.
 *
 * @param  {ControllerContext} c - compound controller context
 */
WidgetController.prototype.update = function(c) {
    var widgetId = parseInt(c.req.params.widgetId || c.req.params.id, 10);
    this.page.renderWidgetAction(c.req, widgetId, c.req.body.perform, c.req.body['with'], function (err, res) {
        c.send({
            code: err ? 500 : 200,
            res: res,
            error: err
        });
    });
};

/**
 * Delete a widget from the page.
 * 
 * @param  {ControllerContext} c - compound controller context
 */
WidgetController.prototype.destroy = function(c) {
    var page = this.page;
    page.widgets.remove(this.widget);
    page.save(function() {
        c.send({
            status: 'success',
            message: 'Widget removed',
            widget: c.locals.widget
        });
    });
};

/**
 * Show the settings dialog for this widget.
 *
 * @param  {ControllerContext} c - compound controller context
 */
WidgetController.prototype.settings = function(c) {
    this.widgetCore = c.compound.hatch.widget.getWidget(this.widget.type);
    var widget = this.widget;
    var self = this;

    this.visibility = [
          { icon: 'mobile-phone', class: 'success', name: 'All devices', value: 'visible-all', description: 'This widget can be viewed on all devices'},
          { icon: 'tablet', class: 'warning', name: 'Tablets', value: 'hidden-xs', description: 'This widget can be viewed on tablets and computers'},
          { icon: 'desktop', class: 'danger', name: 'Computers', value: 'visible-md', description: 'This widget can only be viewed on computers'}
        ];
    this.visibility.selected = _.find(this.visibility, function(v) { return v.value == (widget.settings && widget.settings.visibility || 'visible-all'); });

    this.privacy = [
          { icon: 'globe', class: 'success', name: 'Public', value: 'public', description: 'All users can see this widget'},
          { icon: 'user', class: 'warning', name: 'Members', value: 'members-only', description: 'Only members of this group can see this widget'},
          { icon: 'unlock', class: 'danger', name: 'Private', value: 'private', description: 'Only the group owner and editors can see this widget'},
          { icon: 'lock', class: '', name: 'Signed out', value: 'non-registered', description: 'Only signed out users will see this widget'}
        ];
    this.privacy.selected = _.find(this.privacy, function(p) { return p.value == (widget.settings && widget.settings.privacy || 'public'); });

    // load the tags for the whole group
    c.Tag.all({ where: { groupId: c.req.group.id }}, function (err, tags) {
        c.req.group.tags = tags;
   
        var settings = self.widgetCore.info.settings;
        if (settings && settings.custom) {
            self.page.widgetAction(self.widget.id, 'settings', null, c.req, function (e, settings) {
                c.send(settings);
            });
        } else {
            self.inlineEditAllowed = self.widget.inlineEditAllowed;
            c.render({layout:false});
        }
    });
};
