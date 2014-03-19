exports.routes = function (map) {
    map.post('*', 'upload#upload', {as: 'add'});
    map.get('*', 'upload#upload', {as: 'add'});
};
