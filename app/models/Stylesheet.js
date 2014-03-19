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

'use strict';

var webrequest = require('request');
var async = require('async');
var fs = require("fs");
var less = require("less");
var finder = require('file-finder');
var _ = require('underscore');
var path = require('path');

module.exports = function (compound, Stylesheet) {
    var Group = compound.models.Group;

    // define the stylesheet cache
    Stylesheet.cache = {};

    /**
     * Save and compile the stylesheet with any changes applied.
     * 
     * @param  {Function} callback - callback function
     */
    Stylesheet.prototype.saveAndCompile = function (callback) {
        var self = this;
        
        self.compile(function(err) {
            if(err) {
                console.log(err);
                throw err;
            }

            self.version ++;
            self.lastUpdate = new Date();

            self.save(function(err) {
                if (self.groupId) {
                    Group.find(self.groupId, function (err, group) {
                        group.cssVersion = self.version + '-' + new Date().getTime();
                        group.save(function(err) {
                            callback(err, {
                                version: group.cssVersion,
                                url: group.cssUrl
                            });
                        });
                    });
                } else {
                    callback(err, {
                        version: self.version
                    });
                }
            });
        });
    };

    /**
     * Compile the CSS from this less stylesheet from the stored LESS.
     *
     * @param  {Function} callback - callback function
     */
    Stylesheet.prototype.compile = function (callback) {
        var self = this;
        var tree, css;
        var templatePath = path.join(__dirname, '/../../public/less/theme_template.less');

        fs.readFile(templatePath, 'utf-8', function (err, str) {
            if (err) { 
                return callback(err);
            }

            var moduleCss = '';

            // get the module and widget stylesheets
            async.forEach(Object.keys(compound.hatch.modules), function(key, done) {
                var module = compound.hatch.modules[key];

                if (!module.path) {
                    return done();
                }

                //search for stylesheets
                finder.findFiles(module.path, '.less', function (err, results) {
                    (results || []).forEach(function(modulePath) {
                        var css = fs.readFileSync(modulePath, 'utf-8');
                        moduleCss += css + '\n';
                    });

                    done();
                });
            }, function (err) {
                //replace the variables, bootswatch and the module Css
                str = str.replace("@import \"theme-template-variables.less\";", self.less.variables);
                str = str.replace("@import \"theme-template-bootswatch.less\";", self.less.bootswatch);
                str = str.replace("@import \"theme-template-modules.less\";", moduleCss);

                //add the custom less onto the end
                str += '\n' + self.less.custom;

                new(less.Parser)({
                    paths: [path.dirname(templatePath)],
                    optimization: 0
                }).parse(str, function (err, tree) {
                    if (err) {
                        callback(err);
                    } else {
                        try {
                            css = tree.toCSS({
                                compress: false
                            });

                            //css should be a string
                            if(typeof css == "object") css = css[0];

                            //store in the stylesheet
                            self.css = css;
                            self.version ++;
                            self.lastUpdate = new Date();

                            if(self.groupId) {
                                Group.find(self.groupId, function (err, group) {
                                    var path = compound.app.get('upload path') + '/' + group.cssVersion + '.css';

                                    //save the file
                                    fs.writeFile(path, css, function (err) {
                                        group.cssUrl = '/upload/' + group.cssVersion + '.css';
                                        group.save(function (err) {
                                            if (callback) {
                                                callback(null, group.cssUrl);
                                            }
                                        });
                                    });
                                });
                            } else {
                                //success - callback!
                                callback(null);
                            }
                        } catch (err) {
                            callback(err);
                        }
                    }
                });
            });
        });
    };

    /**
     * Set some custom rules on this stylesheet.
     * 
     * @param {Object} rules - the rules to be set
     */
    Stylesheet.prototype.setRules = function(rules, callback) {
        var css = '';

        for(var selector in rules) {
            for(var rule in rules[selector]) {
                var value = rules[selector][rule];

                //exception for font
                if (selector == "@" && rule == "import") {
                    css = selector + rule + " " + value + ";\n" + css;
                }
                //standard rule
                else css += "\n" + selector + " { " + rule + " : " + value + " }";
            }
        }

        this.less.custom += '\n' + css;
        this.saveAndCompile(callback);
    };

    /**
     * Set the LESS directly for this stylesheet.
     * 
     * @param {Object} less - less object
     */
    Stylesheet.prototype.setLess = function (less, callback) {
        this.less = less;
        this.saveAndCompile(callback);
    };

    /**
     * Set the theme for this stylesheet.
     *
     * @param {String} name - theme to load.
     * @param {Function} callback - continuation function.
     */
    Stylesheet.prototype.setTheme = function (name, callback) {
        var self = this;

        //get the cached version
        if (!Stylesheet.cache[name]) {
            //load the template
            var theme = compound.hatch.themes.getTheme(name);

            //if no theme found, use the default theme settings
            if (!theme) {
                return callback(new Error('Theme "' + name + '" not defined!'));
            }

            if (theme.variables.indexOf('/') === 0) {
                theme.variables = 'http://localhost:3000' + theme.variables;
            }

            if (theme.bootswatch.indexOf('/') === 0) {
                theme.bootswatch = 'http://localhost:3000' + theme.bootswatch;
            }

            var variables = '';
            var bootswatch = '';

            //load the theme data and then process the less
            async.parallel([
                function(callback) {
                    webrequest.get({ uri: theme.variables }, function (err, response, body) {
                        variables = body;
                        callback(err, body);
                    });
                },
                function(callback) {
                    webrequest.get({ uri: theme.bootswatch }, function (err, response, body) {
                        bootswatch = body;
                        callback(err, body);
                    });
                }
            ], function(err, results) {
                if(err) {
                    return callback(err);
                }

                //save to cache
                Stylesheet.cache[name] = {
                    variables: variables,
                    bootswatch: bootswatch
                };

                done();
            });
        }
        else {
            //call the response function
            var theme = Stylesheet.cache[name];

            variables = theme.variables;
            bootswatch = theme.bootswatch;

            done();
        }

        // when everything is done, compile the stylesheet and save
        function done() {
            self.less = {};
            self.name = name;
            self.less.variables = variables;
            self.less.bootswatch = bootswatch;
            self.less.custom = '/* put your custom css here */';

            // compile the stylesheet to a file
            self.saveAndCompile(callback);
        }
    }
};
