exports.escape = function (s) {
    return JSON.stringify(s).replace(/\</g, '&lt;').replace(/\>/g, '&gt;');
};

exports.titleToAnchor = function (title) {
    return title.toLowerCase()
        .replace(/[^-a-zA-Z0-9\s]+/ig, '')
        .replace(/\s/gi, "-");
};

