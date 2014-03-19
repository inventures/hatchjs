var express = require('express');

module.exports = function (compound) {
    var app = compound.app;

    app.configure('development', function () {
        app.enable('log actions');
        app.enable('show errors');
        app.enable('watch');
    });
};
