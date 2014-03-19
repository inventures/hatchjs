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
// See the GNU Affero General Public License for more details. You should have received
// a copy of the GNU General Public License along with Hatch.js. If not, see
// <http://www.gnu.org/licenses/>.
//
// Authors: Marcus Greenwood, Anatoliy Chakkaev and others
//

// This module exports HatchPlatform class constructor

exports.HatchPlatform = HatchPlatform;

// External dependencies

require('yaml-js');
var express = require('express');
var fs = require('fs');
var path = require('path');
var _ = require('underscore');

// Internal dependencies

var initAPI = require('./api');
var exts = require('./extensions.js');
var middleware = require('./middleware.js');
var HatchModule = require('./module.js');

// Debug anchor: platform

var debug = function() {};
if (process.env.NODE_DEBUG && /platform/.test(process.env.NODE_DEBUG)) {
    var $ = require('./colors').$;
    debug = function(x) {
        $.puts($('HATCH PLATFORM: ').grey + x);
    };
}

/**
 * Hatch platform class
 *
 * @param {ExpressApplication}
 * @constructor
 */
function HatchPlatform(app) {
    debug('start hatch platform');
    var hatch = this;
    hatch.middleware = middleware;
    hatch.mediator = express();
    hatch.__defineGetter__('app', function() { return app; });
    hatch.__defineGetter__('compound', function() { return app.compound; });
    hatch.grids = {};
    hatch.modules = {};
    hatch._ = _;

    var gridsDir = app.root + '/app/grids';
    fs.readdirSync(gridsDir).forEach(function (file) {
        hatch.grids[file.replace(/\.ejs$/, '')] = fs.readFileSync(
            app.root + '/app/grids/' + file
        ).toString().split('\n\n');
    });

    app.__defineGetter__('config', function () { return app.settings; });

    initAPI(hatch);

    app.compound.on('structure', loadCommonHelpers);
    app.compound.on('module', function(mod) {
        if (mod && mod.compound) {
            loadCommonHelpers(mod.compound.structure, mod.compound);
        }
    });

    if (process.env.NODE_ENV !== 'test') {
        app.compound.on('ready', function() {
            hatch.loadModules(app.compound.root + '/hatch_modules', true);
            hatch.loadModules(app.compound.root + '/node_modules');
        });
    }

    // configure to use mobile views if available
    registerMobileViewHook(app.compound);
}

/**
 * Publish model on root app and all modules
 *
 * @param {ModelConstructor} model - model constructor with `modelName`.
 */
HatchPlatform.prototype.registerCoreModel = function(model) {
    var hatch = this;
    hatch.compound.models[model.modelName] = model;
    Object.keys(hatch.modules).forEach(function(module) {
        var m = hatch.modules[module];
        if (m.compound && m.compound.models) {
            m.compound.models[model.modelName] = model;
        }
    });
};

/**
 * Load modules from directory
 *
 * @param {String} dir - path to directory.
 */
HatchPlatform.prototype.loadModules = function(dir, force) {
    debug('load modules from ' + dir);
    var hatch = this;
    
    fs.readdirSync(dir).forEach(function(m) {
        // ignore files with extensions
        if (m.indexOf('.') > -1) {
            return;
        }

        // ignore non-hatch modules
        if (!force && m.indexOf('hatch-') === -1) {
            return;
        }

        var modPath = path.join(dir, m);
        hatch.loadModule(m, modPath);
    });
};

/**
 * Load module from path/name
 *
 * @param {String} m - name of module.
 * @param {String} modPath - module name or path.
 */
HatchPlatform.prototype.loadModule = function(m, modPath) {
    debug('load module ' + m);
    var mod = new HatchModule(this, m, require(modPath));
    if (mod) {
        this.modules[m] = mod;
    }
    if (mod.app) {
        this.mediator.use('/' + m, mod.app);

        // configure to use mobile views if available
        registerMobileViewHook(mod.app.compound);
    }
};

function registerMobileViewHook (compound) {
    compound.on('calcview', function (calcParams) {
        var view = calcParams.view;
        if (view === false) {
            return;
        }
        if (calcParams.params.request.agent.mobile) {
            var p = view.split('/');
            p[p.length -1] = 'm.' + p[p.length -1];
            var mobileView = p.join('/');

            if (compound.structure.views[mobileView]) {
                calcParams.result = mobileView;
            }
        }
        return;
    });
}

function loadCommonHelpers(structure, compound) {
    if (!structure.helpers.application_helper) {
        structure.helpers.application_helper = {};
    }
    debug('load extensions');
    for (var i in exts) {
        structure.helpers.application_helper[i] = exts[i];
        compound.controllerExtensions[i] = exts[i];
    }
    compound.controllerExtensions.errors = compound.hatch.errors;
}
