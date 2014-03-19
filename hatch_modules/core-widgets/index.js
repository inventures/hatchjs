//#!/usr/bin/env node

/**
 * Server module exports method which returns new instance of application server
 *
 * @param {Compound} parent - railway/express parent webserver
 * @returns CompoundJS powered express webserver
 */
var app = module.exports = function getServerInstance(parent) {
    return require('compound').createServer({root: __dirname});
};
