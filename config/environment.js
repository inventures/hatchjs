module.exports = function (compound) {

    var express = require('express');
    var app = compound.app;
    var hatch = compound.hatch;

    var MemoryStore = express.session.MemoryStore;
    var RedisStore = require('connect-redis')(express);
    var env = app.get('env');
    var isTest = env === 'test';
    var dbConfig = require(process.env.DB_CONFIG || './database')[env] || {};

    app.configure(function() {
        app.set('database', dbConfig);
        app.set('errors-reporting', require(__dirname + '/errors-reporting.yml')[0][env]);
        var sessionStore = isTest ?
            new MemoryStore() :
            new RedisStore({
                ttl: 86400 * 365,
                db: dbConfig.session && dbConfig.session.database,
                host: dbConfig.session && dbConfig.session.host,
                port: dbConfig.session && dbConfig.session.port,
                pass: dbConfig.session && dbConfig.session.password
            });

        app.set('jsDirectory', '/javascripts/');
        app.set('cssDirectory', '/stylesheets/');
        app.set('cssEngine', 'stylus');
        app.set('upload path', app.root + '/public/upload');
        app.set('fillMissingTranslations', 'yaml');
        app.set('seeds', app.root + '/db/seeds/');

        // date and time formats
        app.set('dateformat', 'DD/MM/YYYY');
        app.set('timeformat', 'HH:mm:ss');
        app.set('datetimeformat', app.get('dateformat') + ' ' + app.get('timeformat'));
        app.set('csrf secret', '~aJlsk029p2$3Hka8*2+$');
        app.set('images proxy', '//images.hatchjs.com/?url=');

        compound.injectMiddlewareAt(2, hatch.middleware.timeLogger(compound));

        // trust proxy for proper https guessing
        app.enable('trust proxy');

        app.use(express.static(app.root + '/public', { maxAge: 86400000 }));
        app.use(express.static(app.root + '/bower_components', { maxAge: 86400000 }));
        
        app.use(express.urlencoded());
        app.use(express.json());
        app.use(express.multipart());
        
        app.use(express.cookieParser('secret'));
        app.use(express.session({
            secret: '~:hatch1#6Platform0*2%',
            store: sessionStore,
            key: 'hatch.sid',
            cookie: { maxAge: 86400000 * 365 }
        }));
        app.use(express.methodOverride());

        app.use(require('express-mobile-agent'));
        app.use(hatch.middleware.csrf(compound));
        app.use(hatch.middleware.pjax(compound));
        app.use(hatch.middleware.rewrite(compound));
        app.use('/do', hatch.mediator);
        app.use(hatch.middleware.hatch(compound));
        app.use(app.router);
        app.use(hatch.middleware.errorHandler(compound));

    });
};
