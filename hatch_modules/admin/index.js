var Application = require('./app/controllers/application');
var fs = require('fs');

/**
 * Server module exports method which returns new instance of application
 * server
 *
 * @param {Compound} parent - compound/express parent webserver
 * @returns CompoundJS powered express webserver
 */
var app = module.exports = function getServerInstance(parent) {
    app = require('compound').createServer({root: __dirname});
    app.compound.tabs = [
        { name: 'users',      url: 'community',  rank: 10, icon: 'user' },
        { name: 'content',    url: 'content',    rank: 20, icon: 'align-left' },
        { name: 'pages',      url: 'pages',      rank: 30, icon: 'book' },
        { name: 'group',      url: 'group',      rank: 40, icon: 'cogs' }
    ];

    if (parent) {
        // setup the content edit forms
        app.compound.on('ready', function() {
            Object.keys(parent.structure.views).forEach(function(key) {
                if(key.indexOf('content/edit/') === 0) {
                    app.compound.structure.views[key] = parent.structure.views[key];
                }
            });
        });

        // setup tabs and the active subtab before page is rendered
        app.compound.on('render', function (vc, c) {
            Application.setupTabs(c);
        });

        // register the permissions for this module
        var permissions = require(__dirname + '/config/permissions.yml')[0].permissions;
        parent.hatch.permissions.register(permissions);

        // load all controllers to init
        fs.readdir(__dirname + '/app/controllers', function (err, files) {
            files.forEach(function (file) {
                require('./app/controllers/' + file);
            });
        });
    }

    return app;
};
