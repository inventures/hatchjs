var should = require('./');
var app, compound, Media;

describe.skip('Media', function() {

    before(function (done) {
        app = getApp(done);
        compound = app.compound;
        Media = compound.models.Media;
    });

    it('should download an image file, put in upload dir and resize', function (done) {
        // create a fake request
        var req = {
            body: {
                file: 'http://edibleapple.com/wp-content/uploads/2009/04/apple_rainbow_logo.jpeg'
            }
        };

        Media.createWithUrl(req.body.file, null, function (err, media) {
            media.resized.length.should.equal(4);

            var url = media.getUrl('100x0');
            url.should.match(/128x0/);

            done();
        });
    });

    it('should upload an image to S3', function (done) {
        // set the s3 settings
        Media.s3 = {
            key: '[redacted]',
            secret: '[redacted]',
            bucket: 's3.hatchcdn.com',
            path: 'upload'
        }

        Media.uploadToCDN = Media.uploadToS3;

        // create a fake request
        var req = {
            body: {
                file: 'http://edibleapple.com/wp-content/uploads/2009/04/apple_rainbow_logo.jpeg'
            }
        };

        Media.createWithUrl(req.body.file, null, function (err, media) {
            media.resized.length.should.equal(4);

            var url = media.getUrl('100x0');
            url.should.match(/128x0/);

            done();
        });
    });

});
