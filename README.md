(Hatch.js is no longer officially supported. Please feel free to fork, chop and change, use as reference)

# Hatch.js documentation

Hatch.js is CMS platform with social features. This package is an
[Express][express] application which can be extended with additional modules. All parts of
this application are accesible via [CompoundJS API][compound-api].

## License

Hatch.js dual-licensed under AGPL and Hatch Commercial License. AGPL means that if you fork the Hatch.js code or write a derivative application (an application which runs on the same CPU process), you must open-source and distribute your project freely under the same AGPL terms. Alternatively a commercial closed-source license is available. More details on [our website][pricing].

#### Partner with us

We believe Hatch.js is a great platform for building social web applications. We are actively seeking partnerships with companies to build commercial products for any purpose on top of the platform. [Contact us][contact] for more information.

## Dependencies

Hatch.js requires [Node 0.8+][node], [Redis 2.6+][redis] and imagemagick to be installed. Bower is also required to install client-side dependencies.

	npm install -g bower

## Installation

Use Hatch.js as an npm. Please see the [examples][examples] for how to use Hatch.js in this way:

	npm install hatchjs

Or standalone:

	git clone https://github.com/inventures/hatchjs

Then:

	npm install
	bower install

## Running Hatch.js

Like most node apps, Hatch.js listens by default on port 3000. We recommend using Nginx or similar to 
proxy requests via port 80 or 443.

	node server

Running in production mode is strongly recommended for live sites. Assets are automatically combined, minified and strongly cached, view templates are pre-compiled resulting in better performance all round:

	NODE_ENV=production node .
	NODE_ENV=production CLUSTER=1 node .

Visit [http://hostname:3000][localhost] to get started with your first group.

By default Hatch.js connects to Redis DB 0 on 127.0.0.1. You can change this by modifying `./config/database.js`.

## Package Structure Overview

### [./server.js](./server.js)

Exports application server builder function. This is main entry point to
application. 

### [./app][app]

Hatch.js is express app structurized with [Compound MVC][compound], so this is standard directory structure for MVC app. It contains core models, controllers, views, helpers, assets and mailers.

### [./app/models][models]

Hatch.js models define all of the business object classes within the application. These can be extended by placing model class files within the `/app/models` folder of your app or your app's modules.

Models are accessed via the application context as follows:

```JavaScript
c.ModelName.functionName();
```

E.g.

```JavaScript
c.Content.all({ where: { groupId: 1 }}, function (err, posts) { 
	// do some stuff with the results
});
```

Hatch.js uses the RedisHQ driver which is part of [JugglingDB][jugglingdb]. Redis may seem like an unusual choice for a primary database. It was chosen because the requirements of Hatch.js and derived apps are usually fairly data-light + traffic-heavy. Redis is an ideal choice because of it's lightning quick performance. Due to the asynchronous nature of Node.js + Redis and the optimised implementation of MULTI batching within the [RedisHQ][redishq] driver, multiple duplicate requests within the same i/o callback context are also able to share queries and results-sets meaning that performance and scalability of the solution is significantly improved over what is achievable using a more conventional database such as MongoDB or MySQL. On rudimentary hardware (e.g. a standard 1 thread AWS micro instance), Hatch.js is easily able to cope with significant levels of traffic and a large number of concurrent users. We estimate the base performance is roughly 20-30x that of platforms such as Wordpress.

The Hatch.js database schema is self-explanatory and can be found [here](./db/schema.js).

### [./lib][lib]

Hatch core. Contains API and core implementation. Hatch APIs are accessible via the context in code as follows:

```JavaScript
c.compound.hatch.apiName.functionName();
```
	
Or globally:

```JavaScript
var compound = require('compound');
compound.hatch.apiName.functionName();
```

The available APIs, documentation and their functions can be found here: [./lib/api][apis]

### [./hatch_modules][modules]

Built-in modules for Hatch.js. Each module is separate application mounted to root
application on `/do/{moduleName}` route.

Modules can modify the existing functionality or models or provide new features.
They can be enabled or disabled on a per-group or per-application basis via the
management area of each group.

Modules documentation can be found within the [README][modules-readme].

### [./test][tests]

Before running tests ensure you have installed dev dependencies:

    npm install
    bower install

Use `make test` command to run all tests. While debugging / TDD use `make
testing` command which is the same as previous, but with `--watch` flag. For
verbose output run `make test-verbose`.

Every piece of code should be tested (ideally). Make sure tests included in pull request.

[contact]: http://hatchjs.com/contact
[pricing]: http://hatchjs.com/pricing
[examples]: ./examples
[express]: http://expressjs.com/
[node]: http://nodejs.org/
[redis]: http://redis.io/
[compound]: https://github.com/1602/compound
[redishq]: https://github.com/jugglingdb/redis-hq-adapter
[jugglingdb]: http://jugglingdb.co/
[models]: /app/models
[apis]: /lib/api/index.js
[localhost]: http://localhost:3000
[tests]: ./test
[server.js]: ./server.js
[app]: ./app
[lib]: ./lib
[modules]: ./hatch_modules
[modules-readme]: ./hatch_modules/README.md
[pull]: ./README.md#11-make-pull-pulling-changes
[feature]: ./README.md#2-make-feature-working-on-feature
[pr]: ./README.md#3-make-pr-make-pull-request
[compound-api]: http://compoundjs.github.com/guides


[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/inventures/hatchjs/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
![GA Badge](https://ga-beacon.appspot.com/UA-20455884-4/inventures/hatchjs)
