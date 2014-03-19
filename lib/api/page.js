
module.exports = PageAPI;

function PageAPI(hatch) {
    this.hatch = hatch;
    this.pages = {};
    this.contentTypes = [];
    this.specialsByContentTypes = {};
}

PageAPI.prototype.register = function registerPageType(name, descriptor) {
    descriptor.type = name;
    var specialPage = new SpecialPage(descriptor);
    this.pages[name] = specialPage;
    if (specialPage.contentType) {
        this.contentTypes.push(specialPage.contentType);
        this.specialsByContentTypes[specialPage.contentType] = specialPage;
    }
};

PageAPI.prototype.get = function getPageByType(type) {
    return this.pages[type];
};

PageAPI.prototype.match = function matchPath(group, path) {
    var page, api = this, params;
    Object.keys(this.pages).forEach(function (type) {
        var sp = api.pages[type], p;
        if (sp && sp.matchRoute) {
            p = sp.matchRoute(group, path);
            if (p) {
                page = sp;
                params = p;
            }
        }
    });
    return [page, params];
};

function SpecialPage(sp) {
    for (var i in sp) this[i] = sp[i];
}

SpecialPage.prototype.path = function path(group, params) {
    var found, sp = this;
    group.pagesCache.forEach(function (page) {
        if (page.type === sp.type) {
            found = page.url;
        }
    });

    var url = found || group.homepage.url.replace(/\/$/, '') + '/' + this.defaultPath;

    if (params && params.defaultPage) return url;

    if (params && params.fullPath) {
        delete params.fullPath;
        url = 'http://' + url;
    } else {
        // remove domain
        url = url.replace(/^.*?\//, '/');
    }

    var mapped = {};

    if (!params) {
        url = url.replace(/\/?:[^\/]+/g, '');
    } else {
        url = url.replace(/(\/)?:([^\/]+)/g, function (m, slash, name) {
            mapped[name] = true;
            return (slash || '') + (params[name] || '');
        });

        var append = [];
        Object.keys(params).forEach(function (paramName) {
            if (mapped[paramName]) return;
            append.push(paramName + '=' + params[paramName]);
        });
        if (append.length) {
            url += '?' + append.join('&');
        }
    }

    return url;
};

SpecialPage.prototype.matchRoute = function matchRoute(group, path) {
    var found, sp = this;
    group.pagesCache.forEach(function (page) {
        if (page.type === sp.type) {
            found = page.url;
        }
    });

    if (found === group.homepage.url + path) return true;

    var url = found || (this.defaultPath ? group.homepage.url + '/' + this.defaultPath : null) || this.path(group).replace(/^.*?\//, '');
    var paramNames = [];
    url = url.replace(/^.*?\//, '').replace(/(\/)?:([^\/]+)/, function (m, slash, name) {
        paramNames.push(name);
        if (!slash) {
            return '([^\/]*)';
        } else {
            return '\\/?([^\/]*)';
        }
    });

    var re = new RegExp('^' + url + '$');
    var re2 = new RegExp('^' + (url.indexOf('/') == 0 ? url.substring(1) : url) + '$');

    var params = {};
    var m;

    path = path.replace(/^\//, '');

    if (m = path.match(re) || path.match(re2)) {
        m.slice(1).forEach(function (token, i) {
            //ignore default special page params
            if(token.indexOf(':') == 0) return;

            params[paramNames[i]] = token;
        });
        return params;
    } else {
        return false;
    }
};

SpecialPage.prototype.toString = function toString() {
    return 'SpecialPage:' + this.type;
};

