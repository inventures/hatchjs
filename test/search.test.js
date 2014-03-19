var should = require('./');
var app, compound, Content;

describe('API/search', function() {

    before(function(done) {
        var db = 9;
        var queue = [];
        app = getApp(function() {
            for (var i = 0; i < db; i++) {
                (function(n) {
                    queue.push(function() {
                        client.select(n, function() {
                            client.del('global:word:KRKSHN', function(err, x) {
                                next();
                            });
                        });
                    });
                })(i);
            }
            next();
        });
        compound = app.compound;
        Content = compound.models.Content;
        var client = Content.schema.adapter.client;

        function next() {
            var fn = queue.shift();
            if (fn) {
                fn();
            } else {
                client.select(1, done);
            }
        }
    });

    it.skip('should use another database for search index', function(done) {
        var client = Content.schema.adapter.client;
        var db = 9;
        var queue = [];
        Content.create({title: 'Shiva', text: 'Krishna', createdAt: new Date}, function(err, c) {
            for (var i = 0; i < db; i++) {
                (function(n) {
                    queue.push(function() {
                        checkDb(n);
                    });
                })(i);
            }
            setTimeout(next, 1500);
        });

        function checkDb(num) {
            client.select(num, function() {
                client.exists('global:word:KRKSHN', function(err, x) {
                    x.should.equal(num === 5 ? 1 : 0, 'on database ' + num);
                    next();
                });
            });
        }

        function next() {
            var fn = queue.shift();
            if (fn) {
                fn();
            } else {
                client.select(1, done);
            }
        }
    });

    it('should reindex search data on save', function(done) {
        Content.create({title: 'Tattam', text: 'Hame', createdAt: new Date}, function (err, c) {
            should.not.exist(err);
            setTimeout(function() {
                Content.all({fulltext: 'Tattam'}, function (err, data) {
                    should.not.exist(err);
                    data.should.have.lengthOf(1);
                    c.title = 'Manana';
                    c.save(function(err) {
                        should.not.exist(err);
                        setTimeout(function() {
                            Content.all({fulltext: 'Tattam'}, function (err, data) {
                                data.should.have.lengthOf(0);
                                Content.all({fulltext: 'Manana'}, function (err, data) {
                                    data.should.have.lengthOf(1);
                                    done();
                                });
                            });
                        }, 500);
                    });
                });
            }, 500);
        });
    });

});
