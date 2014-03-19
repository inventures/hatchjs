var Seed = require('seedjs/lib/seed.js');
var supertest = require('supertest');

module.exports = require('should');

process.env.NODE_ENV = 'test';

if (!process.env.TRAVIS) {
    var semicov = require('semicov');
    if (typeof __cov === 'undefined') {
        process.on('exit', function () {
            semicov.report();
        });
    }

    //semicov.init(['lib', 'app'], 'Hatch.js Core-Widgets Module');
}

var app, dashboard, cw;

before(function(done) {
    app = require('../../../')();
    app.enable('quiet');
    app.compound.on('ready', function() {
        // app.compound.hatch.loadModule('core-widgets', require('path').dirname(require.resolve('hatch-compound/hatch_modules/core-widgets')));
        app.compound.hatch.loadModule('core-widgets', __dirname + '/..');
        cw = app.compound.hatch.modules['core-widgets'];
        done();
    });
});

module.exports.getApp = function(done) {
    var schema = app.compound.orm._schemas[0];
    schema.adapter.logger = function(x) { return function() {
        // console.log(x);
    }; };
    schema.adapter.client.flushdb(function() {
        var seed = new Seed(cw.compound);
        seed.on('complete', function() {
            done();
        });
        // seed.plant(cw.compound, __dirname + '/../db/seeds/test');
        seed.plant(cw.compound, app.get('seeds') + '/test/');
    });
    return app;
};
