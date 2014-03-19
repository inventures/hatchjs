//
// Hatch.js is a CMS and social website building framework built in Node.js 
// Copyright (C) 2013 Inventures Software Ltd
// 
// This file is part of Hatch.js
// 
// Hatch.js is free software: you can redistribute it and/or modify it under the terms of the
// GNU Affero General Public License as published by the Free Software Foundation, version 3
// 
// Hatch.js is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// 
// See the GNU Affero General Public License for more details. You should have received a copy of the GNU
// General Public License along with Hatch.js. If not, see <http://www.gnu.org/licenses/>.
// 
// Authors: Marcus Greenwood, Anatoliy Chakkaev and others
//

module.exports = ImportStreamAPI;

function ImportStreamAPI(hatch) {
    this.hatch = hatch;
    this.ticker = null;
    Object.defineProperty(this, 'importers', {
        enumerable: false,
        configurable: true,
        value: {}
    });
};

/**
 * Register a new importer
 * 
 * @param  {String} name        - name of the importer
 * @param  {String} description - descriptive name
 * @param  {String} icon        - icon to display in admin area
 * @param  {Function} importer  - import function
 */
ImportStreamAPI.prototype.registerImporter = function(name, description, icon, importer) {
    this.importers[name] = {
        name: name,
        description: description,
        icon: icon,
        importer: importer
    };
};

/**
 * Get the names of the importers
 * 
 * @return {Array} 
 */
ImportStreamAPI.prototype.getImporters = function() {
    return this.importers;
};

/**
 * Run an import and fires a callback with the results.
 * 
 * @param  {ImportStream}   stream  -stream to import with
 * @param  {Function} done           callback function
 */
ImportStreamAPI.prototype.runImport = function(stream, done) {
    var fn = this.importers[stream.type].importer;
    fn(stream, done);
};


/**
 * Run all pending import streams.
 */
ImportStreamAPI.prototype.tick = function() {
    var ImportStream = this.hatch.app.models.ImportStream;

    //get all import streams
    ImportStream.all({ where: { enabled: true }}, function(err, streams) {
        streams.forEach(function(stream) {
            if(stream.shouldRun()) {
                stream.run();
            }
        });
    });
};

/**
 * Start the import stream service.
 */
ImportStreamAPI.prototype.startService = function() {
    var c = this;
    this.ticker = setInterval(function() {
        c.tick();
    }, 10000);
};

/**
 * Stop the import stream service.
 */
ImportStreamAPI.prototype.stopService = function() {
    clearInterval(this.ticker);
    ticker = null;
};
