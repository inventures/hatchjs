var fsTools = require('fs-tools');
var fs = require('fs');
var path = require('path');
var restore = require('./restore');

module.exports = SetupController;

function SetupController() {
};

SetupController.prototype.show = function(c) {
    c.render({layout: false, req: c.req});
};

SetupController.prototype.upload = function(c) {
    var req = c.req;
    var res = c.res;
    var filename = req.query.qqfile;
    var file = req.files[filename];

    var uploadPath = c.compound.app.get('upload path');
    var fullPath = path.join(uploadPath, filename);

    fsTools.move(file.path, fullPath, function(err) {
        res.contentType('text/html');
        res.send({ success: 'success', url: fullPath });
    });

};

SetupController.prototype.import = function(c) {
    restore.run(c, c.req.body.dataFilename, c.req.body.domain, function() {
        // redirect to the restored group
        c.send({ redirect: '//' + c.req.body.domain });
    });
};

SetupController.prototype.setup = function(c) {
    var req = c.req;
    var res = c.res;

    // standard application setup
    var fields = ['username', 'email', 'password', 'confirm', 'name', 'url'];

    // validate
    for (var f in fields) {
        var field = fields[f];
        if (!req.body[field]) {
            res.statusCode = 500;
            return res.send({
                status: 'error',
                message: 'Please fill in all fields!'
            });
        }
    }

    // validate password
    if (req.body.password !== req.body.confirm) {
        res.statusCode = 500;
        return res.send({
            status: 'error',
            message: 'Password and confirmation do not match!'
        });
    }

    // load the seed data and modify
    var seeds = require(c.app.get('setupseed') || '../seed.yml')[0];

    seeds[0].Group.name = req.body.name;
    seeds[0].Group.url = req.body.url;
    seeds[0].Group.homepage.url = req.body.url;
    seeds[0].Group.pagesCache[0].url = req.body.url;
    seeds[0].Group.pageUrls[0] = req.body.url;

    seeds[1].Page.url = req.body.url;

    seeds[2].User.username = req.body.username;
    seeds[2].User.email = req.body.email;
    seeds[2].User.password = req.body.password;

    // create the group and administrator user
    (function next(seeds) {
        var seed = seeds.shift();
        if (!seed) return done && done();
        var model = Object.keys(seed)[0];
        c.compound.models[model].upsert(seed[model], next.bind(null, seeds));
    })(seeds);

    // done function - redirects to the newly created default group
    function done() {
        //log the user in
        req.session.userId = 1;

        //redirect to the newly created group
        res.send({redirect: '//' + req.body.url});
    }
};
