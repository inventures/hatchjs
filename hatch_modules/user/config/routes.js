exports.routes = function (map) {
    // user management
    map.post('register.:format?', 'users#create');
    map.post('update.:format?', 'users#update');
    map.post('updatepassword.:format?', 'users#updatePassword', {as: 'updatepassword'});
    map.get('join', 'users#join');
    map.get('join/:invitationCode?', 'users#join');
    map.post('reject', 'users#rejectInvitation', {as: 'rejectInvitation'});
    map.get('hovercard/:id', 'users#hovercard', {as: 'hovercard'});

    // session management
    map.get('logout', 'session#destroy');
    map.post('login.:format?', 'session#create');

    // relationship management
    map.post('follow/:id', 'relationship#follow');
    map.post('unfollow/:id', 'relationship#unfollow');

    // reset password
    map.post('password/reset.:format?', 'password#request', {as: 'resetPassword'});
    map.post('password/change.:format?', 'password#change', {as: 'changePassword'});
};
