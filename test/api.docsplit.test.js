var should = require('./');
var DocSplit = require('../lib/api/docsplit.js');

describe.skip('api/docsplit', function() {

    var docsplit = new DocSplit;

    it('should process pdf file', function(done) {
        docsplit.extractTitle(__dirname + '/fixtures/About Stacks.pdf', function(err, res) {
            should.not.exist(err);
            res.should.equal('About Stacks\n');
            done();
        });
    });

    it.skip('should process docx file', function(done) {
        docsplit.extractTitle(__dirname + '/fixtures/docx-sample.docx', function(err, res) {
            should.not.exist(err);
            res.should.equal('');
            done();
        });
    });

});
