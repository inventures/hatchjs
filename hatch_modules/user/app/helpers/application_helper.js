var _ = require('underscore');

exports.paging = function pagination(paging, url, params, pagingParams) {
    if(!params) params = {};

    //always allow following
    params.follow = 'follow';

    var c = this;
    c.linkTemp = c.linkToRemote;
    if(params.nonRemote) c.linkTemp = c.linkTo;

    if(!paging.pages) {
        if(paging.count && paging.size) {
            paging.pages = [];
            var p = 1;
            for(var i=0; i<paging.count; i+= parseInt(paging.size)) paging.pages.push(p++);
        }
    }

    if(!paging.pages || paging.pages.length <= 1) return '';

    //reduce the pages to the middle five
    var maxLength = 5;
    var min = Math.max(1, Math.min(paging.page - 2, paging.pages.length -4));
    var max = min + maxLength;

    if(paging.pages.length > maxLength) {
        paging.pages = _.filter(paging.pages, function(page) {
            return page >= min && page < max;
        });
    }

    var html = '';

    pagingParams = pagingParams || {};
    pagingParams.class = pagingParams.class + ' pagination';

    html += c.tag('div', pagingParams);
    html += c.tag('ul');

    //Prev
    html += c.tag('li', { class: paging.page <= 1 ? 'disabled':'' });
    html += c.linkTemp('«', paging.page <= 1 ? 'javascript:void();' : url + (paging.page -1), params);
    html += c.end();

    //pages
    paging.pages.forEach(function(page) {
        html += c.tag('li', { class: page == paging.page ? 'active':'' });
        html += c.linkTemp(page, url + page, params);
        html += c.end();
    });

    //Next
    html += c.tag('li', { class: paging.page >= paging.pages[paging.pages.length -1] ? 'disabled':'' });
    html += c.linkTemp('»', paging.page >= paging.pages[paging.pages.length -1] ? 'javascript:void();' : url + (paging.page +1), params);
    html += c.end();

    //View all
    if(params.all) {
        html += c.tag('li');
        html += c.linkTemp(c.__('View all'), url + 1 + '&pageSize=99999', params);
        html += c.end();
    }

    html += c.end();
    html += c.end();

    return html;
};
