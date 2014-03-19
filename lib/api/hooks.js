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

var async = require('async');
var _ = require('underscore');
var $ = require('../colors').$;

module.exports = HooksAPI;

function HooksAPI(hatch) {
    var hooks = this;

    this.hooks = {};
    this.hatch = hatch;
    this.app = hatch.app;
    this.compound = hatch.compound;
    this.enabled = true;

    // this.compound.on('models', this.registerDatabaseHooks.bind(this));
};

/**
 * Fire a hook
 *
 * @param  {[type]}   c      [context]
 * @param  {[type]}   name   [hook name]
 * @param  {[type]}   params [hook params dictionary]
 * @param  {Function} next   [continuation function]
 * @params {Boolean}  after  [fire the .after hook too before the continuation
 * function?]
 */
HooksAPI.prototype.hook = function(c, name, params, next, after) {
    var hooks = this;
    var subscribers = this.hooks[name];
    var compound = this.compound;

    console.log('Hook.fire:' + name);

    if (subscribers && hooks.enabled) {
        // compound.log($('Hook.fire:').green, $(name).blue, '\n');

        //sort by priority
        subscribers = _.sortBy(subscribers, function(subscriber) {
            return -subscriber.priority;
        });

        async.forEachSeries(subscribers, function(subscriber, next) {
            if (subscriber.module && c.req && c.req.group) {
                if (!c.req.group.modules.find(subscriber.module, 'name')) {
                    return next();
                }
            }

            // compound.log($('Hook.fire:').green, $(name).blue,
                // '= ' + subscriber.module + '.' +
                // (subscriber.name || 'anonymous'));

            subscriber.fn(c, params, function() {
                if (after) {
                    hooks.hook(c, name + '.after', params, next);
                } else {
                    next();
                }
            });
        }, function(err) {
            if (err) {
                c.next(err);
            } else {
                if (after) {
                    hooks.hook(c, name + '.after', params, next);
                } else {
                    next();
                }
            }
        });
    } else {
        next();
    }
};

/**
 * Subscribes to a hook
 *
 * @param  {[String]}   name   [name of the hook to subscribe to]
 * @params {String}     module [name of the calling module - or null if we always want to call this hook]
 * @param  {Function}   fn     [hook function]
 */
HooksAPI.prototype.subscribe = function(name, module, fn, priority, functionName) {
    if (!this.hooks[name]) {
        this.hooks[name] = [];
    }
    this.hooks[name].push({
        module: module,
        fn: fn,
        priority: priority || 0,
        name: functionName || fn.name
    });
};

/**
 * Wrap a class level function in a hook
 *
 * @param  {[String]} name         [name of the hook]
 * @param  {[Function]} originalFn [original function to wrap]
 * @return {[Function]}            [newly hook'd function]
 */
HooksAPI.prototype.wrap = function(name, originalFn, after) {
    var hooks = this;
    var slice = Array.prototype.slice;

    return function() {
        var obj = this;
        var args = slice.call(arguments);

        hooks.hook(this, name, arguments, function() {
            originalFn.apply(obj, args);
        }, after);
    }
};

/**
 * Register databse create, save, destroy hooks
 */
HooksAPI.prototype.registerDatabaseHooks = function(models) {
    var hooks = this;

    Object.keys(models).forEach(function(modelName) {
        var model = models[modelName];
        if(!model.schema) return;

        // intercept the save, create & destroy methods
        // TODO: implement using jugglingdb hooks API
        ['save', 'destroy', 'create'].forEach(function(method) {
            var hookName = ['models', modelName, method].join('.');
            var c = method in model ? model : model.prototype;
            c[method] = hooks.wrap(hookName, c[method], true);
        });
    })
};
