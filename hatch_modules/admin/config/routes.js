exports.routes = function (map) {
    'use strict';

    map.camelCaseHelperNames = true;

    // default mapping - TODO: change to dashboard
    map.root('application#index', { as: 'index' });

    // group settings and module management
    map.get('group/modules', 'group#modulesList', {as: 'manageModules'});
    map.get('group/:tab?', 'group#settings', { as: 'group' });
    map.post('group/save/.:format?', 'group#save', { as: 'groupSave' });
    map.get('group/module/:id/setup', 'group#setupModule', { as: 'setupModule' });
    map.get('group/module/:id/disable', 'group#disableModule', { as: 'disableModule' });
    map.get('group/module/:name/enable', 'group#enableModule', { as: 'enableModule' });
    map.put('group/module/:id/update.:format?', 'group#updateModule', { as: 'updateModule' });

    // tags management
    map.get(':section/tags', 'tags#index', { as: 'tags' });
    map.get(':section/tags/new', 'tags#new', { as: 'newTag' });
    map.get(':section/tags/:id/edit', 'tags#edit', { as: 'editTag' });
    map.del(':section/tags/:id/delete', 'tags#destroy', { as: 'deleteTag' });
    map.post(':section/tags/create.:format?', 'tags#create', { as: 'createTag' });
    map.put(':section/tags/:id/update.:format?', 'tags#update', { as: 'updateTag' });
    map.post(':section/tags/:id/add', 'tags#add', { as: 'addToTag' });
    map.post(':section/tags/:id/remove', 'tags#remove', { as: 'removeFromTag' });
    map.get(':section/tags/counts', '#tagCounts', { as: 'tagsCounts' });

    // content management
    map.get('content', 'content#index', { as: 'content' });
    map.get('content/:id/edit', 'content#edit', { as: 'editContent' });
    map.put('content/:id/update.:format?', 'content#update', { as: 'updateContent' });
    map.post('content/create.:format?', 'content#create', { as: 'createContent' });
    map.del('content/:id/destroy', 'content#destroy', { as: 'destroyContent' });
    map.get('content/filter/:filterBy?.:format?', 'content#index', { as: 'filteredContent' });
    map.del('content/destroyAll', 'content#destroyAll', { as: 'destroySelectedContent' });
    map.get('content/new/:type', 'content#new', { as: 'newContentForm'});
    map.get('content/ids', 'content#ids', { as: 'contentIds' });
    map.post('content/:id/unflag', 'content#clearFlags', { as: 'unflag' });
    map.get('content/moderation/load', 'moderation#load', { as: 'loadModeration' });
    map.get('content/moderation/:type.:format?', 'moderation#index', { as: 'moderation' });
    map.get('content/moderation/ids', 'moderation#ids', { as: 'moderationIds' });
    map.del('content/moderation/comment/:commentId', 'moderation#destroyComment', { as: 'destroyComment' });
    map.get('content/streams', 'streams#index', { as: 'streams' });
    map.get('content/streams/new', 'streams#new', { as: 'newStream' });
    map.get('content/streams/:id/edit', 'streams#edit', { as: 'editStream' });
    map.get('content/streams/:id/delete', 'streams#destroy', { as: 'deleteStream' });
    map.put('content/streams/:id/update.:format?', 'streams#update', { as: 'stream' });
    map.post('content/streams.:format?', 'streams#create', { as: 'stream' });
    map.post('content/streams/:id/toggle', 'streams#toggle', {as: 'toggleStream'});

    // user management
    map.get('users', 'users#index', { as: 'community' });
    map.get('users/filter/:filterBy.:format?', 'users#index', { as: 'filteredUsers' });
    map.post('users/sendmessageto', 'users#sendMessageTo', { as: 'sendMessageTo' });
    map.get('users/sendmessage', 'users#sendMessageForm', {as: 'sendMessageForm' });
    map.post('users/sendmessage.:format?', 'users#sendMessage', { as: 'sendMessage' });
    map.get('users/invite', 'users#inviteForm', { as: 'inviteForm' });
    map.post('users/invite.:format?', 'users#sendInvites', { as: 'sendInvites' });
    map.post('users/removeMembers', 'users#removeMembers', { as: 'removeMembers' });
    map.post('users/blacklistMembers', 'users#blacklistMembers', { as: 'blacklistMembers' });
    map.post('users/unblacklistMembers', 'users#unblacklistMembers', { as: 'unblacklistMembers' });
    map.get('users/ids', 'users#ids', { as: 'userIds' });
    map.post('users/:id/resendinvite', 'users#resendInvite');
    map.post('users/:id/remove', 'users#remove');
    map.post('users/:id/destroy', 'users#destroy');
    map.post('users/:id/upgrade', 'users#upgrade');
    map.post('users/:id/downgrade', 'users#downgrade');
    map.post('users/:id/accept', 'users#accept');
    map.get('users/profilefields', 'users#profileFields', { as: 'profileFields' });
    map.get('users/profilefields/new', 'users#newProfileField', { as: 'newProfileField' });
    map.get('users/profilefields/:id/edit', 'users#editProfileField', { as: 'editProfileField' });
    map.post('users/profilefields/reorder', 'users#reorderProfileFields', { as: 'reorderProfileFields' });
    map.post('users/profilefields/save.:format?', 'users#saveProfileField', { as: 'saveProfileField' });
    map.post('users/profilefields/:id/delete', 'users#deleteProfileField', { as: 'deleteProfileField' });
    map.get('users/export', 'users#exportForm', { as: 'export' });
    map.post('users/export', 'users#export', { as: 'export' });

    // pages management
    map.get('pages', 'pages#index', { as: 'pages' });
    map.get('pages/new', 'pages#new', { as: 'newPage' });
    map.get('pages/new-special', 'pages#newSpecial', { as: 'newSpecial' });
    map.get('pages/new-special/:type', 'pages#newSpecial', { as: 'newSpecialType' });
    map.get('pages/specials', 'pages#specials', { as: 'specialPages' });
    map.get('pages/renderTree', 'pages#renderPageTree', { as: 'renderTree' });
    map.get('pages/edit/:id', 'pages#edit', { as: 'editPage' });
    map.post('pages/create.:format?', 'pages#create', { as: 'createPage' });
    map.put('pages/:id/reorder.:format?', 'pages#updateOrder');
    map.put('pages/:id/update.:format?', 'pages#update', { as: 'updatePage' });
    map.post('pages/:group_id?/.:format?', 'pages#create', { as: 'createPage' });
    map.del('pages/:id/destroy', 'pages#destroy', { as: 'deletePage' });

    // edit console routes
    map.post('/page/columns', 'page#updateColumns');
    map.post('/page/grid', 'page#updateGrid');
    map.post('/page/image', 'page#image');
    map.post('/page/link', 'page#link');
    map.post('/page/editconsole', 'page#editconsole', { as: 'editconsole' });

    // stylesheet management routes
    map.post('/stylesheet/theme', 'stylesheet#setTheme');
    map.post('/stylesheet/setrules', 'stylesheet#setRules');
    map.post('/stylesheet/setless', 'stylesheet#setLess');

    // default catch-all route
    map.get('/:controller/:action');
};
