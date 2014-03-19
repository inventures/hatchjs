var should = require('./');
var app, compound, Content, Tag;

describe('Tag', function() {

    before(function (done) {
        app = getApp(done);
        compound = app.compound;
        Content = compound.models.Content;
        Tag = compound.models.Tag;
    });

    it('should get all content tagged with "popular" sorted by "score desc"', function (done) {
        var Tag = compound.models.Tag;

        //setup
        var popular = new Tag({
            groupId: 1,
            count: 0,
            type: 'Content',
            name: 'popular',
            title: 'Most popular posts',
            sortOrder: 'score DESC'
        });

        popular.save(function () {
            popular.updateModel();

            Content.create({
                createdAt: new Date(),
                title: 'test 1',
                text: 'blah blah',
                groupId: 1,
                url: 'one',
                // score: 2,
                likes: Array(4),
                tags: [ popular.id ]
            }, function (err, content) {
                Content.create({
                    createdAt: new Date(),
                    title: 'test 1',
                    text: 'blah blah',
                    groupId: 1,
                    url: 'three',
                    // score: 3,
                    likes: Array(6),
                    tags: [ popular.id ]
                }, function () {
                    Content.create({
                        createdAt: new Date(),
                        title: 'test 1',
                        text: 'blah blah',
                        url: 'two',
                        // score: 1,
                        likes: Array(2),
                        tags: [ popular.id ]
                    }, function () {
                        Content.all({where: {tags: popular.id}}, function (e, c) {

                            c.length.should.equal(3);
                            c[0].score.should.equal(3);
                            c[1].score.should.equal(2);
                            c[2].score.should.equal(1);

                            done();
                        });
                    });
                });
            });
        });
    });

    it('should automatically tag content based on a tag filter', function (done) {
        var Content = compound.models.Content;
        var Tag = compound.models.Tag;

        var moreThan5Likes = new Tag({
            type: 'Content',
            count: 0,
            name: 'more-5-likes',
            title: 'Content with more than 5 likes',
            sortOrder: 'likesTotal DESC',
            filter: 'return function(obj) { return obj.likesTotal > 5; }'
        });

        moreThan5Likes.save(function(err, moreThan5Likes) {
            moreThan5Likes.updateModel();

            var content = new Content({
                createdAt: new Date(),
                title: 'likes 5',
                text: 'blah blah',
                groupId: 1,
                url: 'hey',
                likesTotal: 10,
                likes: Array(10)
            });
            Tag.applyMatchingTags(content, function() {
                content.tags.find(moreThan5Likes.id, 'id').id.should.equal(moreThan5Likes.id);

                Content.create(content, function (err, content) {
                    Content.all({where: {tags: moreThan5Likes.id}}, function (err, posts) {

                        posts.length.should.equal(1);
                        posts[0].url.should.equal('hey');

                        done();

                    });
                });
            });
        })
    });

    it('should subscribe to a tag and check that it can ping', function (done) {
        var now = new Date().getTime();

        compound.models.Tag.all({ where: { name: 'popular' }}, function (err, tags) {
            var tag = tags[0];

            //purposely subscribe an invalid responder
            tag.subscribe('http://www.google.com/do/api/import/1/ping', 60000, function () {
                tag.subscribers.length.should.equal(1);
                tag.updateCount(function () {
                    tag.subscribers.length.should.equal(1);
                    tag.subscribers.items[0].lastPing.should.above(now);

                    tag.pingSubscribers(function () {
                        tag.subscribers.length.should.equal(0);

                        done();
                    });
                });
            });
        });
    });

});
