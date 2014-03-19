var should = require('./');
var app, hatch;
var should = require('should');

describe('Hatch', function() {

    before(function(done) {
        app = getApp(done);
        hatch = app.compound.hatch;
    });

    it('should load module', function(done) {
        hatch.loadModules(__dirname + '/fixtures/modules');
        var mod = hatch.modules.simple;
        should.exist(mod);
        mod.compound.on('ready', function() {
            done();
        });
        mod.info.name.should.equal('simple');
    });

    it('should load widgets', function(done) {
        hatch.loadModule('widgets', __dirname + '/fixtures/widgets');
        done();
    });

    it('should load pages', function(done) {
        hatch.loadModule('pages', __dirname + '/fixtures/pages');
        done();
    });

    it('should register core model', function() {
        var CoreModel = {modelName: 'CoreModel'};
        hatch.registerCoreModel(CoreModel);
        should.exist(hatch.modules.simple.compound.models.CoreModel);
        should.exist(hatch.modules.widgets.compound.models.CoreModel);
        should.exist(hatch.compound.models.CoreModel);
    });

});

