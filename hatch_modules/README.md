# Hatch.js modules

A module is an application which is mounted when the main Hatch.js process loads. It can contain a combination of:

- Code which is executed once at app load time.
- Model classes which can extend existing models or add new ones which will be available via the context object.
- Define it's own routes which are mounted at `/do/{moduleName}/{route}`.
- Define widgets which can be added to a page and interacted with by users.

## Creating a module

A module in it's most basic form consists of one `index.js` file which is loaded by the main application.

```JavaScript
var compound = require('compound');

module.exports = function (c) {
    // do initialisation stuff here
    ...
    
    // return the module to app
    return compound.createServer({root: __dirname});
};
```

## Models

Model extension classes are loaded automatically. They must be placed in `app/models` within your module's folder.

Extending a model such as `User.js` works like this:

```JavaScript
module.exports = function (compound, User) {
    // get the user's first initial
    User.prototype.getFirstInitial = function () {
        return this.firstName && this.firstName.substring(0, 1);
    };
};
```

## Routes

Routes can be defined within your module by adding a routes file at `config/routes.js` and then 1 or more controller files in `app/controllers`.

A `routes.js` file looks like this:

```JavaScript
exports.routes = function (map) {
    map.get('mynewroute', 'controller#mynewroute');
};
```

The URL for this route becomes `/do/module-name/mynewroute` and it can be accessed via the `pathFor('module-name').mynewroute()` helper within an HTML template.

The controller defining the method for this route might look like this:

```JavaScript
function Controller() {

}

module.exports = Controller;

Controller.prototype.mynewroute = function (c) {
    // c is the active request context from CompoundJS
    
    c.render();
};
```

`c.render()` will render the view template with the same name within `app/views/{controllerName}`. In the above example it could be `app/views/controller/mynewroute.ejs`. Hatch.js supports any rendering engine supported by Express.
