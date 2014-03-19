
exports.notify = function(err, settings, done) {
    this.locals.err = err;
    this.send({
        to: settings.email,
        subject: (settings.subject || 'Hatch Error: ') + err.message
    }, done);
};
