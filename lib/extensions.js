var path = require('path');
var _ = require('underscore');
var moment = require('moment');

exports.moduleEnabled = function (moduleName) {
    if (!this.locals.group) {
        return false;
    }
    var found = this.locals.group.modules.find(moduleName, 'name');
    return found || false;
};

exports.moduleConfigured = function (moduleName) {
    var module = this.moduleEnabled(moduleName);
    if (!module) {
        return false;
    }
    var m = this.compound.hatch.modules[moduleName];
    if (!m) {
        throw new Error('Module "' + moduleName + '" is not loaded');
    }
    var info = m.info;
    if (!info.settings || !info.settings.fields) {
        return true;
    }
    var valid = true;
    Object.keys(info.settings.fields).forEach(function(f) {
        if (!module.contract || info.settings.fields[f].required && !module.contract[f]) {
            valid = false;
        }
    });
    return valid;
};

/**
 * Renders a Google JSON location object to a nice simple short address
 *
 * @param {Location} location
 * @returns {String} 'Marylebone, London'
 */
exports.renderLocation = function renderLocation(location) {
    if (!location || !location.address_components) {
        return location;
    }
    return location.address_components[2].short_name + ', ' + location.address_components[3].short_name;
};

exports.pathFor = function(m) {
    var module = this.compound.hatch.modules[m];
    if (module) {
        return module.compound.map.clone(this.context.req.pagePath);
    } else {
        return {};
    }
};

exports.specialPagePath = function (type, params) {
    var sp = this.compound.hatch.page.get(type);
    if (!sp) return '';
    return sp.path(this.req.group, params);
};

/**
 * Strip HTML from the specified HTML and return text
 *
 * @param {String} html - html to strip.
 * @param {Number} maxLength - limit to this many characters.
 *
 * @returns {String} - text without html ended with '...' if length was > maxLength
 */
exports.stripHtml = function stripHtml(html, maxLength) {
    var text = (html || '').replace(/(<([^>]+)>)/ig, ' ');
    if(maxLength && maxLength > 0) {
        if(text.length > maxLength) {
            text = text.substring(0, maxLength);
            if(text.lastIndexOf(' ') > -1) text = text.substring(0, text.lastIndexOf(' '));
            text += '...';
        }
    }

    return text.replace(/^\s+|\s+$/g, '');
};

/**
 * Render some content to the page with the specified view (optional).
 *
 * @param  {Content} post         - content item to render
 * @param  {String}  overrideView - override the default view
 * @return {String}               - HTML code for rendered content
 */
exports.renderContent = function renderContent(post, overrideView) {
    var contentType = this.compound.hatch.contentType;
    var view = overrideView || 'view';
    var ct = contentType.getContentType(post.type);
    if (!ct) {
        return post.type + ' content type is not defined';
    }
    var viewPath = ct[view] || ct.view;
    var viewContext = _.extend(this.viewContext, { post: post });
    var html = '';

    if (!viewPath) {
        return view + ' template not defined for ' + post.type;
    }

    this.res.render(viewPath, viewContext, function (err, result) {
        if (err) {
            html = err;
        } else {
            html = result;
        }
    });

    return html;
};

/**
 * Convert the specified text into HTML with links and line-breaks.
 * 
 * @param  {String} text - input text
 * @return {String}      - HTML
 */
exports.convertLinks = function (text) {
    var expLinks = /((https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])(?=([^"']*["'][^"']*["'])*[^"']*$)/ig;
    var expLines = /\n/ig;
    var html = text.replace(expLinks,'<a href="$1" target="_blank">$1</a>').replace(expLines, '<br>');
    return html;
};

/**
 * Extract the image urls from the specified text and generate thumbnails html.
 * 
 * @param  {String} text - input text
 * @return {String}      - HTML for thumbnails
 */
exports.getThumbnails = function (text) {
    var self = this;

    var expImages = /((https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]+\.(?:jpe?g|gif|png))(?=([^"']*["'][^"']*["'])*[^"']*$)/ig;
    var matches = text.match(expImages);

    if (!matches || matches.length === 0) {
        return '';
    }

    var html = '<div class="row">';

    matches.forEach(function (url) {
        html += '<div class="col-xs-6 col-md-3"><a href="' + url + '" class="thumbnail"><img src="' + self.getUrl(url, '320x0') + '"></a></div>';
    });

    html += '</div>';

    return html;
};

exports.fromNow = function (date, lang) {
    return moment(new Date(date)).lang(lang || (this.req.group && this.req.group.locale) || 'en').fromNow();
};

/**
 * Format a number nicely for display on a web page.
 *
 * E.g.
 *     1234 becomes 1.2k
 *     4350000 becomes 4.3m
 *     1234500000 becomes 1.2b
 *
 * @param  {Number} num - number
 * @return {String}
 */
exports.formatNumber = function (num) {
    if(num === null || num === undefined) {
        return 0;
    } else if(num >= 1000000000) {
        return Math.round(num / 100000000) / 10 + 'b';
    } else if(num > 1000000) {
        return Math.round(num / 100000) / 10 + 'm';
    } else if(num > 1000) {
        return Math.round(num / 100) / 10 + 'k';
    } else {
        return num;
    }
};

/**
 * Get the URL for an image within a media item.
 *
 * @param  {Media}  media - media object to get image from
 * @param  {String} size  - size in wxh format. e.g. 64x64
 * @return {String}
 */
exports.getUrl = function (media, size) {
    if (typeof media === 'string') {
        if (media.indexOf('{') === 0) {
            media = JSON.parse(media);
        } else {
            // image proxy doesn't work on localhost or relative paths
            if (media.indexOf('/') > 0 && media.indexOf('://localhost') === -1) {
                var proxy = this.app.get('images proxy');

                if (media.indexOf('http:' === 0) || media.indexOf('https:') === 0) {
                    media = media.split('//')[1];
                }

                if (proxy) {
                    return proxy + media + '&w=' + size.split('x')[0] + '&h=' + size.split('x')[1];
                }
            }

            return media;
        }
    }
    if (!size) {
        size = '0x0';
    }
    return this.Media.getUrl(media, size);
};

/**
 * Translation helper
 *
 * @return {String} translated version of arguments.
 */
exports.t = function() {
    if (!this._t) {
        this._t = this.compound.T();
        this._t.locale = this.req.query.lang || this.req.group.locale || 'en';
        this._T = this.compound.T;
    }
    return this._t.apply(this, [].slice.call(arguments));
};
