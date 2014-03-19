var path = require('path');
var async = require('async');
var crypto = require('crypto');

var debug = function() {};
if (process.env.NODE_DEBUG && /middleware/.test(process.env.NODE_DEBUG)) {
    var $ = require('./colors').$;
    debug = function(x) {
        $.puts($('HATCH MIDDLEWARE: ').grey + x);
    };
}

exports.rewrite = function(compound) {
    return function rewriteMiddleware(req, res, next) {
        debug('start rewriteMiddleware');
        var url = req.url.split('?')[0];
        var urlParts = url.split('/do/');
        if (urlParts.length > 1) {
            req.pagePath = urlParts[0].replace(/\/$/, '');
            req.moduleName = urlParts[1].split('/')[0];

            loadGroup(compound, req, function (err) {
                res.locals.group = req.group;
                req.url = '/do/' + urlParts[1];

                end(err);
            });
        } else {
            req.pagePath = url.replace(/\/$/, '');
            end();
        }

        function end(err) {
            debug('end rewriteMiddleware');
            next(err);
        }
    }
};

exports.hatch = function(compound) {
    var Group, User;
    var hatch = compound.hatch;

    return function hatchMiddleware(req, res, next) {
        User = compound.models.User;
        Group = compound.models.Group;

        // load user, page and group in parallel to take advantage of MULTI
        async.parallel([
            function (done) {
                authenticate(compound, req, done);
            },
            function (done) {
                loadPage(compound, req, done);
            },
            function (done) {
                loadGroup(compound, req, done);
            }
        ], function (err) {
            if (err) {
                return next(err);
            }
            req.member = req.group && req.user && req.user.memberships &&
                req.user.memberships.find(req.group.id, 'groupId');
            if (req.user && req.group) {
                req.user.hasPermission(req.group, 'edit', function (err, result) {
                    req.user.canEdit = result;
                    next();
                });
            } else {
                next();
            }
        });
    }

};

function authenticate(compound, req, next) {
    if (req.user) {
        return next();
    }

    var AccessToken = compound.models.AccessToken;
    var User = compound.models.User;

    // authenticate via access token
    var token = req.headers.token || req.body.token || req.query.token;

    // make sure to exclude invalid (null) tokens from iOS
    if (token && token !== '(null)') {
        AccessToken.loadUser(token, function(err, user) {
            if (err) {
                return next(err);
            }
            req.user = user;
            next();
        });
    } else if (req.session && req.session.userId) {
        User.find(req.session.userId, function(err, user) {
            if (err) {
                return next(err);
            }
            req.user = user;
            next();
        });
    } else {
        next();
    }

}

function loadPage(compound, req, next) {
    debug('loading page');
    var url = req.headers.host + req.pagePath;

    compound.models.Page.findOne({ where: { url: url }}, function (err, page) {
        req.page = page;
        debug('loading page done, ' +
        (err ? 'with err ' + err + ' ' : '') +
        (page ? 'found' : 'not found'));
        next();
    });
}

function loadGroup(compound, req, next) {
    debug('loading group');
    if (req.group) {
        debug('already got group');
        return next();
    }

    var Group = compound.models.Group;
    var Content = compound.models.Content;
    var groupId = req.query.groupId;

    if (groupId) {
        debug('loading group by id');
        Group.find(groupId, gotGroup);
    } else {
        var url = path.join(req.headers.host || '', req.path || '');
        url = url.split('/do/')[0].split('?')[0];
        url = url.replace(/\/$/, "");

        debug('loading group by url: ' + url);

        Group.findByUrl(url, function (err, group, post) {
            if (group) {
                debug('found group: ' + group.id);
                return gotGroup(err, group);
            } else if (post) {
                req.post = post;
                debug('found content: ' + post.id);

                Group.find(post.groupId, function (err, group) {
                    debug('found group: ' + group.id);
                    // adjust the request url to match the content type
                    req.url = '/' + path.join(group.homepage.url.replace(req.headers.host, ''), post.type);
                    return gotGroup(err, group);
                });
            } else {
                Group.all({limit: 1}, function (err, groups) {
                    // if there are no groups, allow fall through to the setup middleware
                    if (groups.length === 0) {
                        return next();
                    } else {
                        var error = new compound.hatch.errors.NotFound(req, 'Group ('+url+') not found');
                        error.showStack = false;
                        return next(error);
                    }
                });
            }
        });
    }

    function gotGroup(err, group) {
        if(err) {
            return next(err);
        }
        req.group = group;
        return next();
    }
}

exports.errorHandler = function(compound) {
    return errorHandler;
    function errorHandler(err, req, res, next) {
        debug('start errorHandler');
        var code = err.code || 500;

        if(err.showStack) {
            compound.log(err.stack);
        } else {
            // compound.log(err.stack);
        }

        res.status(code);

        if (compound.app.get('env') === 'production') {
            compound.hatch.errorReporter.notify(err, console.log);
        }
        if (req.params && req.params.format === 'json') {
            res.send({error: err});
            return;
        }

        var found = req.group && req.group.pagesCache.find(code.toString(), 'type');
        if (found) {
            compound.models.Page.find(found.id, function (e, p) {
                req.page = p;
                compound.controllerBridge.callControllerAction(
                    'page',
                    'render', req, res, next
                );
            });
        } else {
            var view = compound.structure.views['common/errors/' + code];
            if (!view) {
                view = compound.structure.views['common/errors/500'];
            }
            if (compound.app.get('show errors')) {
                res.locals.err = err;
            } else {
                res.locals.err = null;
            }
            res.render(view);
        }
    }
};

exports.timeLogger = function(compound) {
    return timeLogger;
    function timeLogger(req, res, next) {
        req.startedAt = Date.now();
        next();
    }
};

exports.csrf = function(compound) {
    return csrfProtection;
    function csrfProtection(req, res, next) {
        if (!compound.app.get('csrf enabled')) return next();

        debug('start csrfProtection');

        if (!req.session) {
            return next();
        }

        if (!req.session.csrfToken) {
            req.session.csrfToken = Math.random();
            req.csrfParam = 'authenticity_token';
            req.csrfToken = sign(req.session.csrfToken);
            return next();
        }

        // publish secure credentials
        req.csrfParam = 'authenticity_token';
        req.csrfToken = sign(req.session.csrfToken);

        if (['HEAD', 'GET', 'OPTIONS'].indexOf(req.originalMethod) === -1) {
            var token = req.param(req.csrfParam) || req.header('X-CSRF-Token');
            if (!token || token !== req.csrfToken) {
                compound.log('Incorrect authenticity token');
                debug('end csrfProtection: failed');
                res.send(403);
            } else {
                debug('end csrfProtection: passed');
                next();
            }
        } else {
            debug('end csrfProtection: not required');
            next();
        }

    }

    function sign(n) {
        var res = crypto.createHash('sha1').update(n.toString()).update(compound.app.get('csrf secret').toString()).digest('hex');
        return res;
    }
};

exports.pjax = function (compound) {
    return function (req, res, next) {
        var send = res.send;
        res.send = function (data) {
            if (req.query._pjax) {
                data = data.substring(data.indexOf('pjax-body'));
                data = data.substring(data.indexOf('>') +1);
                data = data.substring(0, data.indexOf('<!-- END PJAX-BODY -->'));
            }
            send.apply(this, [data]);
        };
        next();
    };
};
