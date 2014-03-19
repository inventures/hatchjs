var should = require('./');

var app, compound, Page;
var async = require('async');

describe('Page', function() {

    before(function (done) {
        app = getApp(done);
        compound = app.compound;
        Page = compound.models.Page;
    });

    describe('renderHtml', function() {

        it('should render a page with 1 widget', function(done) {
            Page.find(1, function(err, page) {
                var url = page.url.replace(/example.com\/?/, '/');
                getClient(app).get(url).end(function(err, res) {
                    should.not.exist(err);
                    should.exist(res);
                    res.text.should.include('Contents of single widget');
                    done();
                });
            });
        });

        it('should render a page with 4 different widgets on it', function(done) {
            Page.find(2, function(err, page) {
                var url = page.url.replace(/example.com\/?/, '/');
                getClient(app).get(url).end(function(err, res) {
                    res.text.should.include('No group header has been set. Double-click to edit.');
                    res.text.should.include('Widget 2');
                    res.text.should.include('Widget 3');
                    res.text.should.include('Widget 4');
                    done();
                });
            });
        });

    });

});
