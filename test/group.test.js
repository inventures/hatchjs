var should = require('./');
var Group, Page, app, compound;
var should = require('should');

describe('Group', function() {

    before(function(done) {
        app = getApp(done);
        compound = app.compound;
        Group = compound.models.Group;
        Page = compound.models.Page;
    });

    it('should create clone', function(done) {
        Group.findOne({where:{url: 'example.com'}}, function(e, g) {
            g.clone({
                url: 'example.com/1602',
                name: 'Example 1602'
            }, function(e, clone) {
                should.not.exist(e);
                should.exist(clone);
                clone.url.should.equal('example.com/1602');
                clone.homepage.url.should.equal('example.com/1602');
                done();
            });
        });
    });
});
