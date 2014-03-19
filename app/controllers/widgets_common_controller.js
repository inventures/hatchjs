layout('widgets');

var _ = require('underscore');

before('init env', function (c) {
    var locals = this;
    locals._ = _;
    locals.group = req.group;
    locals.user = req.user;
    req.data = body.data; 
    locals.data = req.data && req.data.data;
    locals.canEdit = req.user && req.group && req.user.adminOf(req.group);
    locals.inlineEditAllowed = false;

    locals.group.definePage(req.pagePath, c, gotPage);

    function gotPage(err, page) {
        if (err || !page) {
            return send('Widget not found');
        }
        locals.page = page;
        var wc = req.body.data.templateWidget ? 'templateWidgets' : 'widgets';
        var id = parseInt(req.body.data.widgetId, 10);
        locals.widget = page[wc].find(id, 'id');

        if (locals.widget) {
            locals.widget.settings = locals.widget.settings || {};
        }
        next();
    }
});

action(function show() {
    render();
});
