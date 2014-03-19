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

var _ = require('underscore');

module.exports = ThemesAPI;

/**
 * Register ThemesAPI.
 */
function ThemesAPI(hatch) {
    this.hatch = hatch;
    this.themes = [];
    this.defaultTheme = null;
    this.defaults = {
        'title': '[default]',
        'thumbnail' : '/bootswatch/[default]/thumbnail.png',
        'variables' : '/bootswatch/[default]/variables.less',
        'bootswatch' : '/bootswatch/[default]/bootswatch.less'
    };
}

/**
 * Register new theme defaults.
 * 
 * @param  {Object} newDefaults - new default theme settings (see above)
 */
ThemesAPI.prototype.registerDefaults = function(newDefaults) {
    this.defaults = newDefaults;
};

/**
 * Register a new theme.
 * 
 * @param  {Object} theme - theme to register
 */
ThemesAPI.prototype.registerTheme = function(theme) {
    var self = this;

    //register default properties
    ['variables', 'bootswatch', 'thumbnail', 'title'].forEach(function(prop) {
        if(!theme[prop]) theme[prop] = self.defaults[prop].replace('[default]', theme.name);
    });

    // remove existing (if we are overriding a theme)
    this.themes = _.reject(this.themes, function (t) { return t.name === theme.name; });

    //add the theme to the list
    this.themes.push(theme);
};

/**
 * Set the default theme from the existing themes list.
 * 
 * @param  {String} name - name of the default theme
 */
ThemesAPI.prototype.registerDefaultTheme = function(name) {
    this.defaultTheme = name;
};

/**
 * Get all of the themes.
 * 
 * @return {Object} - all themes
 */
ThemesAPI.prototype.getThemes = function() {
    return this.themes;
};

/**
 * Get a theme by its name.
 * 
 * @param  {String} name - name of the theme
 * @return {Object}        theme
 */
ThemesAPI.prototype.getTheme = function(name) {
    //should we use the default theme
    if (!name || name === 'default') {
        name = this.defaultTheme;
    }

    var theme = _.find(this.themes, function(theme) { return theme.name === name; });
    return theme;
};
