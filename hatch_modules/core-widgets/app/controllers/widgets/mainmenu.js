var Widget = require(process.env.HATCH_WIDGETCONTROLLERPATH);

function MainMenuController(init) {
    Widget.call(this, init);
}

module.exports = MainMenuController;
require('util').inherits(MainMenuController, Widget);

MainMenuController.prototype.show = function (c) {
	c.locals.pages = c.Page.hierarchy(c.req.group.pagesCache);
	c.locals.breadcrumb = c.Page.breadcrumb(c.req.group.pagesCache, c.req.page);
	
	c.render({ layout: 'widgets' });
};