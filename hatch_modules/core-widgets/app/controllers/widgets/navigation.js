var _ = require('underscore');
var Widget = require(process.env.HATCH_WIDGETCONTROLLERPATH);

function MainMenuController(init) {
    Widget.call(this, init);
    init.before(setupPages);
}

module.exports = MainMenuController;
require('util').inherits(MainMenuController, Widget);

function isSpecialPage(page) {
    return [null, '', 'page', 'home'].indexOf(page.type) === -1;
}

function setupPages (c) {
    var pages = c.Page.tree(c.locals.group.pagesCache);
    var current = c.req.page;

    switch (this.widget.settings.display) {
        case 'current':
            pages = pages.filter(function(page) {
                return page.parentId == current.parentId;
            });
            break;
        case 'current+below':
            pages = pages.filter(function(page) {
                return page.parentId == current.id || page.parentId == current.parentId;
            });
            break;
        case 'below':
            pages = pages.filter(function(page) {
                return page.parentId == current.id;
            });
            break;
        case 'all':
        case '':
            break;
    }

    var lowest = 10;

    // filter out special pages
    pages = pages.filter(function(page) {
        if (page.level < lowest) {
            lowest = page.level;
        }
        return !isSpecialPage(page);
    });
   
    // reduce the level by that of the lowest level page
    if (lowest > 0) {
        pages = pages.map(function(page) {
            page = _.clone(page);
            page.level -= lowest.level;
            return page;
        });
    }

    c.locals.pages = pages;
    c.next();
}