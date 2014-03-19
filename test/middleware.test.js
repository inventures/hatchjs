// This test written using mocha and should. Run it using `make test` command.

var should = require('./'), app, compound, hatch;

describe('middleware', function() {
    var tester;

    before(function(done) {
        app = getApp(function() {
            compound = app.compound;
            hatch = compound.hatch;
            done();
        });
    });

    function middleware(req, res, next) {
        tester(req, res, next);
    }

    function remove() {
        var index;
        app.stack.forEach(function(m, i) {
            if (m.handle === middleware) {
                index = i;
            }
        });
        app.stack.splice(index, 1);
    }

    describe('rewrite', function() {

        before(function() {
            compound.injectMiddlewareAfter('rewriteMiddleware', middleware);
        });

        after(remove);

        it('should not rewrite urls without "/do/"', test('/', function(req) {
            req.pagePath.should.equal('');
            req.url.should.equal('/');
        }));

        it('should rewrite urls with "/do/"', test('/pa/do/simple/users', function(req) {
            req.pagePath.should.equal('/pa');
            req.url.should.equal('/do/simple/users');
        }));

    });

    describe('hatch', function() {

        before(function() {
            compound.injectMiddlewareAfter('hatchMiddleware', middleware);
        });

        after(remove);

        it('should auth user by token', test('/?token=letmein', function(req) {
            should.exist(req.user);
        }));

        it('should not auth user by expired token', test('/?token=expired', function(req) {
            should.not.exist(req.user);
        }));

    });

    describe('error', function() {

        before(function() {
            compound.injectMiddlewareAfter('hatchMiddleware', middleware);
        });

        after(remove);

        it('should send 404 error in json', test('/', function(req, res, n) {
            req.params = {format: 'json'};
            n(new hatch.errors.NotFound(req, 'custom message'));
        }, function(err, c) {
            c.text.should.equal(JSON.stringify({
                error: {
                    code: 404,
                    name: 'Not Found',
                    message: 'custom message'
                }
            }));
            c.res.headers['content-type'].should.equal('application/json; charset=utf-8');
            c.res.statusCode.should.equal(404);
        }));

        it('should send 500 error in json', test('/', function(req, res, n) {
            req.params = {format: 'json'};
            var hello = world;
        }, function(err, c) {
            c.text.should.equal(JSON.stringify({
                error: {
                    code: 500,
                    name: 'ReferenceError',
                    message: 'world is not defined'
                }
            }));
            c.res.headers['content-type'].should.equal('application/json; charset=utf-8');
            c.res.statusCode.should.equal(500);
        }));

        it('should send 404 error in html with status 404', test('/', function(req, res, n) {
            req.params = {format: 'html'};
            n(new hatch.errors.NotFound(req, 'custom message'));
        }, function(err, c) {
            c.res.headers['content-type'].should.equal('text/html; charset=utf-8');
            c.res.statusCode.should.equal(404);
        }));

        it('should send 500 error in html with status 500', test('/', function(req, res, n) {
            req.params = {format: 'html'};
            n(new hatch.errors.InternalError('custom message'));
        }, function(err, c) {
            c.res.headers['content-type'].should.equal('text/html; charset=utf-8');
            c.res.statusCode.should.equal(500);
        }));

        it('should send 403 error in html with status 403', test('/', function(req, res, n) {
            req.params = {format: 'html'};
            n(new hatch.errors.Forbidden('custom message'));
        }, function(err, c) {
            c.res.headers['content-type'].should.equal('text/html; charset=utf-8');
            c.res.statusCode.should.equal(403);
        }));

        it.skip('should render custom error using group special page', test('/', function(req, res, n) {
            var customError = new Error('hello world');
            customError.code = 501;
            compound.models.Group.find(1, function(err, group) {
                req.group = group;
                n(customError);
            });
        }, function(err, c) {
            // c.res.headers['content-type'].should.equal('text/html; charset=utf-8');
            c.res.statusCode.should.equal(501);
        }));

    });

    function test(url, callback, after) {
        return function(done) {
            getClient(app).get(url).end(function(err, c) {
                if (err) {
                    console.log(err);
                }
                if (after) {
                    after(err, c);
                    done();
                }
            });
            tester = function(req, res, next) {
                callback(req, res, next);
                if (!after) {
                    done();
                }
            };
        };
    }

});
