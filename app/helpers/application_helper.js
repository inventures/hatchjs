exports.__ = function (s) {
    return s;
};

exports.icon = function (icon) {
    return '<i class="fa fa-' + icon + '"></i>';
};

exports.openGraphTags = function () {
    var req = this.req,
        page = req.page,
        group = req.group,
        content = req.content,
        html = [],
        og = {
            title: content && content.title || page.metaTitle || page.title + ' - ' + group.name,
            description: content && (content.excerpt || exports.stripHtml(req.content.text, 280)) ||
            req.page.metaDescription || req.group.metaDescription,
        url: req.protocol + '://' + (req.content && req.content.url || req.page.url),
        type: req.content && 'article' || 'website',
        site_name: req.group.name
    };

    if (req.content && req.content.previewImage) {
        og.thumbnail = req.content && req.content.previewImage;
    }

    html = [];
    for (var property in og) {
        if (og.hasOwnProperty(property)) {
            html.push('<meta property="og:' + property +
            '" content=' + JSON.stringify(og[property]) + ' />');
        }
    }
    return html.join('\n        ');
};

var javascripts = {
    common: [
        'jquery2.0.0', 'jquery-hoverintent', 'jquery-valadd', 'jquery-blink',
        'jquery-textarea-autogrow', 'jquery-noty', 'jquery-cookie','jquery-pjax',
        'bootstrap',
        'hatch-ajax', 'hatch-upload', 'hatch-page', 'hatch-widget', 'hatch', 'i18n'
    ],
    privileged: [
        'jquery-ui.min', 'chosen.jquery', 'jquery-rule', 'jquery-datatables',
        'jquery-selectrange', 'jquery-blockui', 'redactor/redactor',
        'jquery-colorscheme', 'hatch-dragdrop', 'hatch-css-properties',
        'hatch-styleeditor', 'hatch-inline-edit', 'hatch-management',
        'hatch-editconsole'
    ],
    all: null
};

javascripts.all = javascripts.common.concat(javascripts.privileged);

exports.javascripts = function () {
    if (exports.isPrivileged.call(this)) {
        return javascripts.all;
    } else {
        return javascripts.common;
    }
};

exports.isPrivileged = function () {
    return !!(this.req.member && this.req.user.canEdit);
};

exports.pageTitle = function () {
    var req = this.req, page = req.page;
    return req.title || page.metaTitle || page.title + ' - ' + req.group.name;
};

exports.getStylesheetPath = function () {
    var req = this.req, group = req.group,
    cssUrl = this.res.app.enabled('static css') && group.cssUrl;
    if (cssUrl) {
        return cssUrl;
    } else {
        var routes = this.pathFor('stylesheet');
        if (routes.css) {
            return routes.css(group.cssVersion || 0);
        } else {
            throw new Error('Module stylesheet is not loaded');
        }
    }
};

exports.formatNumber = function formatNumber(num) {
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

