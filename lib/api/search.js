//
// Hatch.js is a CMS and social website building framework built in Node.js
// Copyright (C) 2013 Inventures Software Ltd
// 
// This file is part of Hatch.js
// 
// Hatch.js is free software: you can redistribute it and/or modify it under
// the terms of the GNU Affero General Public License as published by the Free
// Software Foundation, version 3
// 
// Hatch.js is distributed in the hope that it will be useful, but WITHOUT ANY
// WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
// FOR A PARTICULAR PURPOSE.
// 
// See the GNU Affero General Public License for more details. You should have
// received a copy of the GNU General Public License along with Hatch.js. If
// not, see <http://www.gnu.org/licenses/>.
// 
// Authors: Marcus Greenwood, Anatoliy Chakkaev and others
//

// Debug anchor: search

var debug = function() {};
if (process.env.NODE_DEBUG && /search/.test(process.env.NODE_DEBUG)) {
    var $ = require('../colors').$;
    debug = function(x) {
        $.puts($('HATCH SEARCH: ').cyan + x);
    };
}

try {
var reds = require('reds');
} catch(e){}
try {
var solr = require('solr-client');
} catch(e){}
var KILL_SEARCH_TIMEOUT = process.env.NODE_ENV === 'test' ? 100 : 30000;

module.exports = SearchAPI;

/**
 * API for fulltext search
 *
 * provides common programming interface for fulltext search engines:
 * [x] reds
 * [x] solr
 * [-] sphinx
 * [-] clucene
 * [-] xapian
 */
function SearchAPI(hatch) {
    var search = this;
    this.hatch = hatch;

    var _searchAdapter = null;
    this.__defineGetter__('search', function() {
        if (!_searchAdapter) {
            _searchAdapter = this.getSearchAdapter();
        }
        return _searchAdapter;
    });
    this._searches = {};

    hatch.compound.on('ready', function() {
        // search.search.client = reds.client;
        hatch.compound.orm._schemas[0].fulltextSearch = search;
    });
};

/**
 * Add content to search index - build both global and namespaced indexes
 *
 * @param {String} ns - namespace
 * @param {Number} id - identifier of record
 * @param {Text} content - text data to build index
 */
SearchAPI.prototype.add = function (ns, id, content, callback) {
    var pool = this;
    this.search.add(id, content, function() {
        if (ns) {
            pool.searchFor(ns).add(id, content, callback);
        } else {
            callback();
        }
    });
};

/**
 * Update index for id/content globally and within ns
 *
 * @param {String} ns - namespace
 * @param {Number} id - identifier of record
 * @param {Text} content - text data to build index
 */
SearchAPI.prototype.update = function (ns, id, content) {
    var search = this;
    search.remove(ns, id, function () {
        search.add(ns, id, content);
    });
};

/**
 * Remove data from index
 *
 * @param {String} ns - namespace
 * @param {Number} id - identifier of record
 * @param {Function} callback
 */
SearchAPI.prototype.remove = function (ns, id, cb) {
    var pool = this;
    this.search.del(id, function() {
        if (ns) {
            pool.searchFor(ns).del(id, cb);
        }
    });
};

/**
 * Query global index
 *
 * @param {Function} callback(err, ids)
 */
SearchAPI.prototype.query = function query(query, cb) {
    this.search.query(query || '', cb);
};

/**
 * Query group index
 *
 * @param {String} ns
 * @param {String} query
 * @param {Function} callback(err, ids)
 */
SearchAPI.prototype.queryNS = function (ns, query, cb) {
    this.searchFor(ns).query(query || '', cb);
};

/**
 * Return search object for specific namespace
 *
 * @param {String} ns - namespace.
 *
 * @api private
 */
SearchAPI.prototype.searchFor = function searchFor(ns) {
    if (!this._searches[ns]) {
        this._searches[ns] = this.getSearchAdapter(ns);
        // kill by timeout
        // this._searches[ns].timeout = setTimeout(function () {
            // if (this._searches[ns]) {
                // delete this._searches[ns];
            // }
        // }.bind(this), KILL_SEARCH_TIMEOUT);
    }
    return this._searches[ns];
};

SearchAPI.prototype.quit = function quit(cb) {
    this.search.client.quit(cb);
};

SearchAPI.prototype.getSearchAdapter = function getSearchAdapter(id) {
    var conf = this.hatch.app.get('database');
    var Adapter = {
        reds: RedsSearchAdapter,
        solr: SolrSearchAdapter
    }[conf && conf.fulltext && conf.fulltext.driver || 'reds'];

    if (Adapter) {
        return new Adapter(id || 'global', conf);
    }

    throw new Error('Search engine ' + this.driver + ' is not supported');
};

function RedsSearchAdapter(id) {
    this.connection = reds.createSearch(id);
}

RedsSearchAdapter.prototype.add = function(id, content, callback) {
    if (!content) return;
    this.connection.client = reds.client;
    this.connection.index(content, id, function(err) {
        if (callback) {
            callback(err);
        }
    });
};

RedsSearchAdapter.prototype.del = function(id, cb) {
    this.connection.client = reds.client;
    this.connection.remove(id, cb);
};

RedsSearchAdapter.prototype.query = function(query, cb) {
    this.connection.query(query).end(cb);
};

function SolrSearchAdapter(id, conf) {
    conf = (conf || {fulltext:{}}).fulltext || {};
    debug('Creating solr adapter for ' + id);
    console.log(conf);
    var id = (id || '').replace(/\//g, '-');
    this.connection = solr.createClient(
        conf.host || '127.0.0.1',
        conf.port || '8983',
        conf && conf.cores && conf.cores[id] || id,
        '/solr'
    );
    this.connection.autoCommit = true;
}

SolrSearchAdapter.prototype.add = function(id, content, callback) {
    this.connection.add({ id: id, content: content }, function(err, result) {
        console.log(result);
        if (err) console.log(err)
        if (callback) {
            callback(err);
        }
    });
};

SolrSearchAdapter.prototype.del = function(id, callback) {
    this.connection.deleteByID(id, callback);
};

SolrSearchAdapter.prototype.query = function(str, callback) {
    var q = this.connection.createQuery().q('*' + str + '*');
    this.connection.search(q, function(err, obj) {
        if (err) {
            console.log(err);
            return callback(err);
        }
        callback(err, obj.response.docs.map(function(doc) {
            return doc.id;
        }));
    });
};
