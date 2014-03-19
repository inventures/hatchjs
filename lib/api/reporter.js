var util = require('util');
var async = require('async');

module.exports = ErrorReporter;

function ErrorReporter(hatch) {
    'use strict';

    var reporter = this;

    this.hatch = hatch;
    this.compound = hatch.compound;
    this.app = hatch.compound.app;
    this._transports = null;

    process.addListener('uncaughtException', function (e) {
        if (!(e instanceof Error)) {
            e = new Error('uncaughtException was not an error:', util.inspect(e));
        }

        if (!e.hasOwnProperty('name')) {
            e.name = 'uncaughtException';
        }

        console.log('uncaughtException');
        console.error(e.stack || e);

        reporter.notify(e, function () {
            if (!process.isMaster) {
                process.exit(1);
            }
        });
    });
}

ErrorReporter.prototype.notify = function notify(err, cb) {
    'use strict';

    console.log('Notify error');
    console.log(err && err.stack || err);

    // Errors should be objects. If not, then make a new object.
    if (!(err instanceof Error)) {
        err = new Error('errorReporter handed non-error: ' + util.inspect(err));
    }

    // If this is a 404, then we have nothing else to do.
    if (err.code === 404) {
        return cb();
    }

    // We don't care if there are errors in transport. Just log them.
    function handleTransport(transport, cb) {
        transport(err, function (transportError) {
            console.log(arguments);

            if (transportError) {
                console.log(transportError.stack || transportError);
            }

            cb();
        });
    }

    // Process the error through the transports.
    async.each(this.getTransports(), handleTransport, cb);
};

ErrorReporter.prototype.getTransports = function transport(){
    var rep = this;
    if (this._transports) {
        return this._transports;
    }
    var reporters = this.app.get('errors-reporting') || {};

    var tr = this._transports = [];
    Object.keys(reporters).forEach(function(type) {
        if (reporters[type]) {
            tr.push(rep.instantiateTransport(type, reporters[type]));
        }
    });

    return this._transports;

};

ErrorReporter.prototype.instantiateTransport = function(type, settings) {
    return new ErrorReporter.transport[type](this, settings);
};

ErrorReporter.transport = {
    mail: function(reporter, settings) {
        return function(err, cb) {
            reporter.compound.mailer.send('error/notify', err, settings, cb);
        };
    },
    jabber: function(reporter, settings) {
        throw new Error('not implemented');
    },
    sentry: function(reporter, settings) {
        return function () {};
    }
};
