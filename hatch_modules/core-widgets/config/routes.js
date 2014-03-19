exports.routes = function (map) {

    map.resources('widgets', {path: 'widget'});
    map.post('/widget', 'widgets#create');
    map.post('/widget/:widgetId/remove', 'widgets#remove');

    // wildcard to catch all other widget actions
    map.post('/widget/:widgetId/:action', 'widgets');
    map.put('/widget/:widgetId/:action', 'widgets');
    map.get('/widget/:widgetId/:action', 'widgets');
};
