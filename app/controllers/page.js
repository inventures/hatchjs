var Application = require('./application');

module.exports = PageController;

function PageController(init) {
    Application.call(this, init);
}

require('util').inherits(PageController, Application);

PageController.prototype.show = function (c) {
    var Page = c.Page;

    this.group.definePage(c.req.url, c, function render(err, page) {
        if (err) {
            return c.next(err);
        } else if (!page) {
            return c.next(new c.errors.NotFound(c.req, 'Page not found for url: ' + c.req.url));
        }

        c.req.page = page;

        c.compound.hatch.hooks.hook(c, 'page.show', { page: page, req: c.req, group: c.req.group, user: c.req.user }, function () {
            page.renderHtml(c.req, function (err, html) {
                if (err) {
                    return c.next(err);
                }
                c.render({
                    page: html,
                    title: page.title,
                    req: c.req
                });
            });
        });
    });
};

PageController.prototype.render = function (c) {
    c.req.page.renderHtml(c.req, function (err, html) {
        if (err) {
            return c.next(err);
        }
        c.render('show', {
            page: html,
            title: c.req.page.title,
            req: c.req
        });
    });
};
