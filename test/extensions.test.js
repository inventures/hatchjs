// This test written using mocha and should. Run it using `make test` command.

var should = require('./'), app, compound, hatch;

var group;

describe('extensions /controller/', function() {

    before(function(done) {
        app = getApp(function() {
            hatch = app.compound.hatch;
            hatch.loadModules(__dirname + '/fixtures/modules');
            app.compound.structure.controllers.test = TestController;
            app.compound.models.Group.findOne(function(err, g) {
                group = g;
                done();
            });
        });
    });

    describe('moduleEnabled', function() {

        it('should be defined on controller context', test(function(c) {
            should.exist(c.moduleEnabled);
            c.moduleEnabled.should.be.a('function');
            c.next();
        }));

        it('should return config when module enabled', test(function(c) {
            c.moduleEnabled('not exist').should.be.false;
            c.locals.group = group;
            c.moduleEnabled('admin').should.be.ok;
            c.next();
        }));

        it('should return false when module not enabled', test(function(c) {
            c.locals.group = group;
            c.moduleEnabled('adminka').should.not.be.ok;
                c.next();
        }));

        it('should return false when module not enabled', test(function(c) {
            delete c.locals.group;
            c.moduleEnabled('not exist').should.be.false;
            c.next();
        }));

    });

    describe('moduleConfigured', function() {

        it('should be defined on controller context', test(function(c) {
            should.exist(c.moduleConfigured);
            c.moduleConfigured.should.be.a('function');
            c.next();
        }));

        it('should return false when module is not enabled', test(function(c) {
            c.moduleConfigured('adminka').should.be.false;
            c.next();
        }));

        it('should return true when module not configurable', test(function(c) {
            c.locals.group = group;
            hatch.modules.admin = {info: {}};
            c.moduleConfigured('admin').should.be.true;
            c.next();
        }));

        it('should return false when module not configured or configuration is not valid', test(function(c) {
            c.locals.group = group;
            hatch.modules.admin = {info:{settings:{fields:{a:{required: true}}}}};
            c.moduleConfigured('admin').should.be.false;
            c.next();
        }));

        it('should return true when module configured ok', test(function(c) {
            c.locals.group = group;
            hatch.modules.admin = {info:{settings:{fields:{a:{required: true}}}}};
            c.moduleEnabled('admin').contract = {a: 1};
            c.moduleConfigured('admin').should.be.true;
            c.next();
        }));

    });

    describe('pathFor', function() {

        it('should be defined on controller context', test(function(c) {
            should.exist(c.pathFor);
            c.next();
        }));

        it('should return path helpers collection for module', test(function(c) {
            hatch.modules.simple.compound.map.resources('users');
            should.exist(c.pathFor('simple').users);
            c.pathFor('simple').users().should.equal('/do/simple/users');
            c.next();
        }));

        it('should return empty object for not existing module', test(function(c) {
            delete hatch.modules.admin;
            JSON.stringify(c.pathFor('admin')).should.equal('{}');
            c.next();
        }));

    });

    describe('stripHtml', function() {

        it('should be defined on controller context', test(function(c) {
            should.exist(c.stripHtml);
            c.next();
        }));

        it('should return string without html', test(function(c) {
            c.stripHtml('hello <b attr="param">world</b>').should.equal('hello  world');
            c.next();
        }));

        it('should return text with specified length without trimming words', test(function(c) {
            c.stripHtml('hello lorem <i>ipsum</i>', 10).should.have.lengthOf(8);
            c.stripHtml('hello lorem', 10).should.have.lengthOf(8);
            c.stripHtml('hellolo lolo', 10).should.have.lengthOf(10);
            c.stripHtml('hellolololo', 10).should.have.lengthOf(13);
            c.next();
        }));

    });

    describe('renderContent', function() {

        it('should be defined on controller context', test(function(c) {
            should.exist(c.renderContent);
            c.next();
        }));

        it('should be defined on controller context', test(function(c) {
            c.renderContent('ha');
            c.next();
        }));

    });

    describe('errors', function() {

        it('should raise 404 error', test(function(c) {
            should.exist(c.errors.NotFound);
            var err = c.errors.NotFound('message');
            err.should.be.instanceOf(Error);
            err.should.be.instanceOf(c.errors.NotFound);
            err.code.should.equal(404);
            err.message.should.equal('message');
            c.next();
        }));

        it('should raise 403 error', test(function(c) {
            should.exist(c.errors.Forbidden);
            var err = c.errors.Forbidden('message');
            err.should.be.instanceOf(Error);
            err.should.be.instanceOf(c.errors.Forbidden);
            err.code.should.equal(403);
            err.message.should.equal('message');
            c.next();
        }));

        it('should raise 500 error', test(function(c) {
            should.exist(c.errors.InternalError);
            var err = c.errors.InternalError('message');
            err.should.be.instanceOf(Error);
            err.should.be.instanceOf(c.errors.InternalError);
            err.code.should.equal(500);
            err.message.should.equal('message');
            c.next();
        }));

        it('should raise 503 widget error', test(function(c) {
            should.exist(c.errors.WidgetError);
            var err = c.errors.WidgetError('message');
            err.should.be.instanceOf(Error);
            err.should.be.instanceOf(c.errors.WidgetError);
            err.code.should.equal(503);
            err.message.should.equal('message');
            c.next();
        }));

    });

    describe('formatNumber', function() {
        it('should format number', test(function(c) {
            should.exist(c.formatNumber);
            c.formatNumber(1234).should.equal('1.2k');
            c.formatNumber(123456).should.equal('123.5k');
            c.formatNumber(1234567).should.equal('1.2m');
            c.formatNumber(1234567890).should.equal('1.2b');
            c.formatNumber(543).should.equal(543);
            c.next();
        }));
    });

    describe('fromNow', function() {
        it('should return time from now in words', test(function(c) {
            should.exist(c.fromNow);
            var day = 86400000;
            c.fromNow(Date.now() - day).should.equal('a day ago');
            c.fromNow(Date.now() - day * 2).should.equal('2 days ago');
            c.next();
        }));
    });

    describe('getUrl', function() {
        it('should return url to media', test(function(c) {
            should.exist(c.getUrl);
            c.getUrl('str').should.equal('str');
            c.getUrl({url: 'test'}).should.equal('test');
            c.next();
        }));
    });

});

function test(fn) {
    return function (done) {
        TestController.test = fn;
        app.compound.controllerBridge.callControllerAction('test', 'action', {pagePath: ''}, {}, done);
    };
}

function TestController(){}

TestController.prototype.action = function(c) {
    TestController.test.call(this, c);
};
