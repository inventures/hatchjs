var should = require('./');

var app, compound, Content, Comment;
var async = require('async');

describe('Comment', function() {

    before(function (done) {
        app = getApp(done);
        compound = app.compound;
        Content = compound.models.Content;
        Comment = compound.models.Comment;
    });

    it('should create 5 comments on a content post and check cached comments.length == 3', function(done) {
        Content.create({
            createdAt: new Date,
            title: 'Hello',
            text: 'World'
        }, function(err, content) {
            async.times(5, function (n, done) {
                content.postComment(1, 'hello', done);
            }, function () {
                // reload the content
                Content.find(content.id, function (err, content) {
                    content.comments.items.length.should.equal(Content.CACHEDCOMMENTS);
                    content.commentsTotal.should.equal(5);
                    done();
                });
            });
        });
    });

});
