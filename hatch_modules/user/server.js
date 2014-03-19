/**
 * Server module exports method which returns new instance of application
 * server
 *
 * @param {Compound} parent - railway/express parent webserver.
 * @returns CompoundJS powered express webserver
 */
var app = module.exports = function getServerInstance(parent) {
    return require('compound').createServer({root: __dirname});
};

if (!module.parent) {
    var port = process.env.PORT || 3000;
    var host = process.env.HOST || '0.0.0.0';

    var server = app();
    server.listen(port, host, function () {
        console.log(
            'Compound server listening on %s:%d within %s environment',
            host, port, server.set('env')
        );
    });
}

