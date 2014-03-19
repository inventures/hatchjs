exports.routes = function (map) {
    map.get('/css/:version', 'stylesheet#css', {as: 'css'});
    map.get('/theme/:name/:version?', 'stylesheet#theme', {as: 'theme'});
    map.get('/fonts/:font', 'stylesheet#font');
};
