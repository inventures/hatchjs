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

var util = require('util');

var colors = {
    'bold' : [1, 22],
    'italic' : [3, 23],
    'underline' : [4, 24],
    'inverse' : [7, 27],
    'white' : [37, 39],
    'grey' : [90, 39],
    'black' : [30, 39],
    'blue' : [34, 39],
    'cyan' : [36, 39],
    'green' : [32, 39],
    'magenta' : [35, 39],
    'red' : [31, 39],
    'yellow' : [33, 39]
};

var colorNames = Object.keys(colors);

exports.styles = {
    'special': 'cyan',
    'number': 'yellow',
    'boolean': 'yellow',
    'undefined': 'grey',
    'null': 'bold',
    'string': 'green',
    'date': 'magenta',
    'regexp': 'red'
};

function stylize(str, styleType) {
    var style = exports.styles[styleType];

    if (style) {
        return colorize(str, style);
    } else {
        return str;
    }
}

function colorize(str, color) {
    var code = colors[color];
    if (!code) return str;
    return '\u001b[' + code[0] + 'm' + str +
           '\u001b[' + code[1] + 'm';
};

exports.stylize = stylize;
exports.colorize = colorize;
exports.$ = function $(str) {
    str = new(String)(str);

    colorNames.forEach(function (name) {
        Object.defineProperty(str, name, {
            get: function () {
                return $(colorize(this, name));
            }
        });
    });
    return str;
};

var time = Date.now();
var timing = process.env.TIMING;
exports.$.puts = function () {
    util.puts((timing ? Date.now() - time + ' ' : '') + [].join.call(arguments, ' '));
    if (timing === 'relative') {
        time = Date.now();
    }
};

