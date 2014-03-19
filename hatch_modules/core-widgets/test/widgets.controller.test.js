var should = require('./');
var supertest = require('supertest');

describe('WidgetsController', function() {
    var app, request, User, Page;

    before(function(done) {
        app = should.getApp(done);
        Page = app.compound.models.Page;
        request = supertest(app);
    });

    it('should require admin user for creating widget', function(done) {
        post('/do/core-widgets/widget', {
            addWidget: 'any/thing',
        }, function(err, res) {
            res.statusCode.should.equal(403);
            done();
        });
    });

    it('should add widget to page', function(done) {
        post('/do/core-widgets/widget', {
            token: 'daddyhome',
            addWidget: 'core-widgets/static',
        }, function(err, res) {
            res.statusCode.should.equal(200);
            res.text.should.include('Content not set. Double-click to edit.');
            done();
        });
    });

    it('should set widget title', function(done) {
        post('/do/core-widgets/widget/2/settitle', {
            token: 'daddyhome',
            title: 'mik'
        }, function(err, res) {
            res.statusCode.should.equal(200);
            res.text.should.equal('ok');
            Page.find(1, function(err, page) {
                page.widgets[2].settings.title.should.equal('mik');
                done();
            });
        });
    });

    it('should perform custom widget action', function(done) {
        post('/do/core-widgets/widget/1/update', {
            token: 'daddyhome',
            perform: 'test',
            with: {hello: 'world'}
        }, function(err, res) {
            res.statusCode.should.equal(200);
            res.text.should.include('Undefined action widgets/static#test(/widget/core-widgets/static)');
            done();
        });
    });

    it('should render settings dialog', function(done) {
        post('/do/core-widgets/widget/1/settings', {
            token: 'daddyhome'
        }, function(err, res) {
            res.statusCode.should.equal(200);
            done();
        });
    });

    it('should configure widget', function(done) {
        post('/do/core-widgets/widget/1/configure', {
            token: 'daddyhome',
            hello: 'world'
        }, function(err, res) {
            res.statusCode.should.equal(200);
            res.text.should.equal('ok');
            Page.find(1, function(err, page) {
                page.widgets[1].settings.hello.should.equal('world');
                done();
            });
        });
    });

    it('should set contrast', function(done) {
        post('/do/core-widgets/widget/1/contrast', {
            token: 'daddyhome',
        }, function(err, res) {
            res.statusCode.should.equal(200);
            res.text.should.equal('ok');
            done();
        });
    });

    it('should destroy widget', function(done) {
        post('/do/core-widgets/widget/2/destroy', {
            token: 'daddyhome',
        }, function(err, res) {
            res.statusCode.should.equal(200);
            res.text.should.equal('ok');
            Page.find(1, function(err, page) {
                should.not.exist(page.widgets[2]);
                done();
            });
        });
    });

    function post(url, data, cb) {
        return request.post(url)
        .set('Host','example.com')
        .set('User-Agent','mocha')
        .send(data)
        .end(cb);
    }
});
