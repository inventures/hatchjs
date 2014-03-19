//
// Hatch.js is a CMS and social website building framework built in Node.js 
// Copyright (C) 2013 Inventures Software Ltd
// 
// This file is part of Hatch.js
// 
// Hatch.js is free software: you can redistribute it and/or modify it under the terms of the
// GNU Affero General Public License as published by the Free Software Foundation, version 3
// 
// Hatch.js is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// 
// See the GNU Affero General Public License for more details. You should have received a copy of the GNU
// General Public License along with Hatch.js. If not, see <http://www.gnu.org/licenses/>.
// 
// Authors: Marcus Greenwood, Anatoliy Chakkaev and others
//

'use strict';

var Application = require('./application');

module.exports = GroupController;

function GroupController(init) {
    Application.call(this, init);
    init.before(loadModules);
    init.before(findModule, {only: ['updateModule', 'disableModule']});
}

require('util').inherits(GroupController, Application);

/**
 * Setup the tabs for this controller.
 * 
 * @param  {HttpContext} c - context
 */
Application.installTabGroup('group', function(c) {
    var subTabs = [];

    subTabs.push({ header: 'group.headers.groupSettings' });

    // actions
    subTabs.push({ name: 'group.headers.settings', url: c.pathTo.group('settings') });
    subTabs.push({ name: 'group.headers.url', url: c.pathTo.group('url') });
    subTabs.push({ name: 'group.headers.headerfooter', url: c.pathTo.group('headerfooter') });
    subTabs.push({ name: 'group.headers.analytics', url: c.pathTo.group('analytics') });
    subTabs.push({ name: 'group.headers.locale', url: c.pathTo.group('locale') });

    if (c.locals.modulesEnabled.length > 0) {
        subTabs.push({ header: 'group.headers.moduleSettings' });
        subTabs.push({ name: 'modules.headers.manageModules', url: c.pathTo.manageModules });

        c.locals.modulesEnabled.forEach(function (inst) {
            if (inst.name && inst.module && inst.module.info.title && inst.module.info.settings) {
                subTabs.push({
                    name: inst.module.info.title,
                    url: c.pathTo.setupModule(inst.name)
                });
            }
        });
    }

    return subTabs;
});

// finds a specific module for the context
function findModule(c) {
    c.req.group.modules.forEach(function (m) {
        if (m &&  (
            m.name === c.req.params.module_id ||
            m.name === c.req.params.id
        )) {
            c.locals.groupModule = m;
            c.locals.groupModuleIndex = m.id;
            c.locals.module = m;
        }
    });
    c.next();
}

// loads the modules that are enabled for this group to display in the sidebar
function loadModules(c) {
    c.locals.modulesEnabled = [];

    Object.keys(c.req.group.modules.items).forEach(function (m) {
        var inst = c.req.group.modules.items[m];
        inst = {
            name: inst.name,
            module: c.compound.hatch.modules[inst.name]
        };
        c.locals.modulesEnabled.push(inst);
    });

    c.next();
}

/**
 * Show the group settings form.
 * 
 * @param  {HttpContext} c - http context
 *                       c.tab - settings tab to show
 */
GroupController.prototype.settings = function (c) {
    var tab = c.locals.tab = c.req.params.tab || 'settings';
    c.locals.pageName = 'group-'  + c.locals.tab;
    c.locals.group = c.req.group;
    c.render(tab);
};

/**
 * Save group settings for this group.
 * 
 * @param  {HttpContext} c - http context
 *                       c.body - group settings/attributes to update
 */
GroupController.prototype.save = function(c) {
    var group = c.req.group;
    delete c.req.body.undefined;

    if(c.body.url) {
        group.updateUrl(c.body.url, function(err) {
            if(err) return c.error({ message: err.toString() });

            //make sure to redirect to the new url
            c.send({ redirect: group.homepage.url });
        });
    }
    else {
        // stop circular reference to inst.module.compound
        group.modules.items.forEach(function (inst) {
            delete inst.module;
        });

        group.updateAttributes(c.req.body, function (err) {
            if (err) {
                return c.send({
                    message: 'Error saving settings',
                    status: 'error',
                    icon: 'remove-sign'
                });
            }
            
            c.send({
                message: 'Group settings saved',
                status: 'success',
                icon: 'ok'
            });
        });
    }
};

/**
 * Show the module list where the administrator can enable or disable modules.
 * 
 * @param  {HttpContext} c - http context
 */
GroupController.prototype.modulesList = function (c) {
    c.locals.modulesAvailableList = Object.keys(c.compound.hatch.modules).map(function (m) {
        return c.compound.hatch.modules[m];
    });
    
    c.locals.modulesEnabledList = Object.keys(c.locals.group.modules).map(function (m) {
        return c.locals.group.modules[m];
    });

    c.render();
};

/**
 * Show the module settings screen.
 * 
 * @param  {HttpContext} c - http context
 *                       c.id - module name
 */
GroupController.prototype.setupModule = function(c) {
    var moduleName = c.params.id;
    this.pageName = 'module-' + moduleName;

    this.inst = this.group.modules.find(moduleName, 'name');
    this.inst.module = c.compound.hatch.modules[moduleName];

    c.render();
};

/**
 * Enable the specified module so that it is available for this group.
 * 
 * @param  {HttpContext} c - http context
 *                       c.module_id - name of the module to enable
 */
GroupController.prototype.enableModule = function enable(c) {
    var group = this.group;
    var groupModule = {
        name: c.params.name,
        contract: {}
    };

    group.modules.push(groupModule);
    group.save(function () {
        c.redirect(c.pathTo.manageModules);
    });
};

/**
 * Update the settings of the specified module.
 * 
 * @param  {HttpContext} c - http context
 *                       c.body - module settings to update
 */
GroupController.prototype.updateModule = function(c) {
    var data = c.req.body;
    var module =  c.req.group.modules.find(c.params.id, 'name');
    module.contract = data;

    c.req.group.save(function() {
        c.flash('info', 'Module settings updated');
        c.send({ redirect: c.pathTo.manageModules() });
    });
};

/**
 * Disable the specified module so that it is no longer available for this group.
 * 
 * @param  {HttpContext} c - http context
 *                       c.module_id - name of module to disable
 */
GroupController.prototype.disableModule = function (c) {
    this.group.modules.remove(this.groupModuleIndex);
    this.group.save(function (err) {
        if (err) {
            return c.sendError(err);
        }

        c.redirect(c.pathTo.manageModules);
    });
};