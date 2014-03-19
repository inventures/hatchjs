module.exports = HatchModule;

var fs = require('fs');
var path = require('path');

// Debug anchor: hmod

var debug = function() {};
if (process.env.NODE_DEBUG && /hmod/.test(process.env.NODE_DEBUG)) {
    var $ = require('./colors').$;
    debug = function(x) {
        $.puts($('HATCH MODULE: ').blue + x);
    };
}

/**
 * Hatch module class.
 *
 * @param {HatchPlatform} hatch - hatch platform.
 * @param {Function} mod - module initializer.
 * @constructor
 */
function HatchModule(hatch, name, mod) {
    debug('instantiate module ' + name);
    var module = this;

    this.hatch = hatch;
    this.name = name;

    if ('function' === typeof mod) {
        this.app = mod(hatch.compound);
        this.compound = this.app && this.app.compound || null;
    } else {
        return;
    }

    var compound = module.compound;
    var app = module.app;

    if (compound) {
        compound.parent = hatch.compound;
        compound.hatch = hatch;
        module.path = compound.root;
        Object.keys(compound.parent.models).forEach(function(m) {
            compound.models[m] = compound.parent.models[m];
        });
    }

    module.loadConfig();
    module.loadPages();
    module.registerHooks();
    module.registerWidgets();

    if (compound) {
        compound.on('ready', function() {
            if (!compound.injectMiddlewareBefore(app.router, hatch.middleware.hatch(compound))) {
                app.use(app.router);
            }
            hatch.compound.emit('module', module);
        });
    } else {
        hatch.compound.emit('module', module);
    }

}

/**
 * Register hooks for module. Called on initialization of module.
 */
HatchModule.prototype.registerHooks = function registerHooks() {
    var mod = this;
    if (!this.compound) {
        return;
    }
    this.compound.on('before controller', function(ctl, act, req, res, next) {
        // TODO: understand why this is required
        // if (req.pagePath !== req.url) {
            ctl.pathTo = ctl.path_to = mod.compound.map.clone(req.req.pagePath);
        // }
    });
};

HatchModule.prototype.get = function get(key) {
    return this.app.get(key);
};

HatchModule.prototype.set = function set(key, val) {
    return this.app.set(key, val);
};

/**
 * Initialize widgets listed in ./config/widgets.yml
 */
HatchModule.prototype.registerWidgets = function registerWidgets() {
    if (!fs.existsSync(this.path + '/config/widgets.yml')) {
        debug('no widgets declared');
        return;
    }

    debug('register widgets');
    var mod = this;
    var ws = require(this.path + '/config/widgets.yml')[0];
    if (ws) {
        debug('register widgets: ' + Object.keys(ws));
        Object.keys(ws).forEach(function (w) {
            mod.hatch.widget.register(mod.name, w, {info: ws[w]});
        });
    }

    mod.compound.on('routes', function (map) {
        map.namespace('widgets', function (widgets) {
            widgets.post(':controller/:action');
            widgets.post('*', function notFound(req, res) {
                res.send('Widget for ' + req.url + ' not found');
            });
        });
    });

    mod.compound.on('structure', function (structure) {
        structure.controllers['widgets/common_controller'] = mod.compound.parent.structure.controllers['widgets_common_controller'];
        structure.views['layouts/widgets_layout'] = mod.compound.parent.structure.views['layouts/widgets_layout'];
        if (structure.helpers['application_helper']) {
            var source = mod.compound.parent.structure.helpers['widgets_common_helper'];
            var destination = structure.helpers['application_helper'];
            Object.keys(source).forEach(function (helperName) {
                destination[helperName] = source[helperName];
            });
        } else {
            structure.helpers['application_helper'] = mod.compound.parent.structure.helpers['widgets_common_helper'];
        }
    });
};

/**
 * Initialize special pages located in ./app/pages
 */
HatchModule.prototype.loadPages = function loadPages() {
    var hatch = this.hatch;
    var pagesPath = this.path + '/app/pages/';
    if (!fs.existsSync(pagesPath)) {
        return;
    }
    debug('load pages');
    fs.readdirSync(pagesPath).forEach(function (file) {
        var name = file.replace(/\.(js|coffee)$/, '');
        hatch.page.register(name, require(pagesPath + file));
    });
}

/**
 * Load config from ./config/module.yml
 */
HatchModule.prototype.loadConfig = function loadConfig() {
    var mod = this;
    var confPath = this.path + '/config/module.yml';

    if (fs.existsSync(confPath)) {
        debug('load config');
        try {
            mod.info = require(confPath)[0];
        } catch (e) {}
    }

    if (!mod.info) {
        mod.info = {};
    }
};
