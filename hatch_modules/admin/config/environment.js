module.exports = function (compound) {

    var express = require('express');
    var app = compound.app;

    if (compound.parent) {
        app.configure(function(){
            app.set('jsDirectory', '/javascripts/');
            app.set('js app root', compound.parent.root);
            app.set('css app root', compound.parent.root);
            app.use('/javascripts', express.static(compound.parent.root + '/public/javascripts', { maxAge: 86400000 }));
            app.use(app.router);
        });
    }
};