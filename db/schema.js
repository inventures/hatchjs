var User = define('User', function () {
    property('username', String, {index: true, sort: true, fulltext: true});
    property('email', String, {index: true, sort: true, fulltext: true});
    property('type', String, {index: true});
    property('password', String);
    property('hasPassword', Boolean);
    property('avatar', JSON);
    property('name', String);
    property('firstname', String);
    property('lastname', String, {sort: true});
    property('lastnameLetter', String, {index: true});
    property('displayName', String, {sort: true});
    property('oneLiner', String);
    property('memberships', []);
    property('membership', JSON);
    property('following', [], {index: true}); // [] of user.ids followed by user
    property('otherFields', JSON);
    property('mailSettings', JSON);
    property('fulltext', String, {fulltext: true});
    property('tags', [], {index: true, fulltext: true});
    property('tagNames', String, {sort: true});
    property('facebookId', String, {index: true});
    property('linkedinId', String, {index: true});
    property('twitterId', String, {index: true});

    // group membership indexes
    property('membershipGroupId', JSON, {index: true});
    property('memberGroupId', JSON, {index: true});
    property('pendingGroupId', JSON, {index: true});
    property('editorGroupId', JSON, {index: true});
    property('blacklistedGroupId', JSON, {index: true});
    property('inviteGroupId', JSON, {index: true});

    set('ignoreNullValues', true);
    set('safe', true);
    set('defaultSort', 'username');
});

if (User.schema.adapter.defineFulltextIndex) {
    User.schema.adapter.defineFulltextIndex('User', 'fulltext');
}

var AccessToken = define('AccessToken', function () {
    property('userId', Number, {index: true});
    property('clientId', Number, {index: true});
    property('token', String, {index: true});
    property('scope', JSON);
    property('expiryDate', Date);

    set('ignoreNullValues', true);
});

var OAuthCode = define('OAuthCode', function () {
    property('clientId', Number, {index: true});
    property('userId', Number, {index: true});
    property('code', String, {index: true});
    property('scope', JSON);
    property('expiryDate', Date);
    property('state', String);

    set('ignoreNullValues', true);
});

var OAuthClient = define('OAuthClient', function () {
    property('name', String);
    property('apiKey', String, {index: true});
    property('apiSecret', String);
    property('redirectUri', String);

    set('ignoreNullValues', true);
});

var Group = define('Group', function () {
    property('url', String, {index: true});
    property('pageUrls', JSON, {index: true});
    property('path', String);
    property('name', String,  {fulltext: true, sort: true});
    property('type', String, {index: true});
    property('privacy', String, {index: true});
    property('subgroups', JSON);
    property('pagesCache', []);
    property('homepage', JSON);
    property('modules', []);
    property('joinPermissions', String);
    property('favicon', String);
    property('metaKeywords', String);
    property('metaDescription', String);
    property('navBarType', String);
    property('navBarStyle', String);
    property('hideSearch', Boolean);
    property('headerHtml', String);
    property('footerHtml', String);
    property('cssVersion', String);
    property('cssUrl', String);
    property('googleAnalyticsId', String);
    property('customProfileFields', []);
    property('profileFields', []);
    property('tags', [], {index: true});
    property('importStreams', JSON);
    property('createdAt', Date, {sort: true});
    property('locale', String);

    set('ignoreNullValues', true);
    set('defaultSort', 'name');
});

var Stylesheet = define('Stylesheet', function () {
    property('groupId', Number, { index: true });
    property('name', String, { index: true });
    property('css', String);
    property('version', Number);
    property('lastUpdate', Date);
    property('less', JSON);

    set('ignoreNullValues', true);
});

// function Widget(data, list) { };

var Page = define('Page', function () {
    property('title', String, {fulltext: true});
    property('url', String, {index: true});
    property('customUrl', Boolean);
    property('privacy', String);
    property('grid', String, {default: '02-two-columns'});
    property('columns', JSON); // JSON [ {size: 6, widgets: [1,2,3]}, {size: 6, widgets: [4,5,6]}]
    property('widgets', []);
    property('metaTitle', String);
    property('metaDescription', String);
    property('metaKeywords', String);
    property('type', String, {index: true});
    property('tags', String);
    property('hideFromNavigation', Boolean);
    property('order', Number);
    property('templateId', Number);
    property('parentId', Number, {index: true});
    property('groupId', Number, {index: true});
    // property('tags', [], {index: true});

    set('ignoreNullValues', true);
    set('defaultSort', 'order');
});

var Content = define('Content', function () {
    property('type', String, {index: true });
    property('imported', Boolean, {index: true });
    property('title', String, { sort: true });
    property('text', String, { sort: true });
    property('excerpt', String);
    property('previewImage', JSON);
    property('attachments', JSON);
    property('poll', JSON);
    property('location', JSON);
    property('comments', [], {fulltext: true });
    property('commentsTotal', Number);
    property('repliesTotal', Number, {index: true, sort: true });
    property('likes', []);
    property('dislikes', []);
    property('flags', []);
    property('hasFlag', Boolean, {index: true});
    property('likesTotal', Number, {index: true, sort: true });
    property('views', Number, {index: true, sort: true });
    property('score', Number, {index: true, sort: true });
    property('groupId', Number, {index: true });
    property('replyToId', Number, {index: true });
    property('tagString', String, {index: true });
    property('authorId', Number, {index: true });
    property('author', JSON);
    property('privacy', String, {index: true });
    property('createdAt', Date, {index: true, sort: true });
    property('updatedAt', Date, {index: true });
    property('timestamp', Number, {index: true, sort: true });
    property('timeSince', String);
    property('priority', Number, {index: true, sort: true });
    property('url', String, {index: true });
    property('fulltext', String);
    property('importData', JSON);
    property('tags', [], {index: true});
    property('tagNames', String, {sort: true});

    set('ignoreNullValues', true);
    set('defaultSort', 'createdAt DESC');
});

if (Content.schema.adapter.defineFulltextIndex) {
    Content.schema.adapter.defineFulltextIndex('Content', 'fulltext');
}

var ContentFeedItem = define('ContentFeedItem', function () {
    property('userId', Number, {index: true });
    property('contentId',  Number ),
    property('createdAt', Date, {index: true} );

    set('ignoreNullValues', true);
    set('defaultSort', 'createdAt DESC');
});

var Comment = define('Comment', function () {
    property('text', String, {fulltext: true});
    property('groupId', Number, {index: true});
    property('contentId', Number, {index: true});
    property('authorId', Number, {index: true});
    property('createdAt', Date, {sort: true});
    property('likes', []);
    property('flags', []);
    property('hasFlag', Boolean, {index: true});
    property('author', JSON);

    set('defaultSort', 'createdAt DESC');
});

var Like = define('Like', function () {
    property('createdAt', Date);
    property('userId', Number, {index: true});
    property('contentId', Number, {index: true});
    property('groupId', Number, {index: true});

    set('defaultSort', 'createdAt');
});

var Activity = define('Activity', function () {
    property('createdAt', Date);
    property('type', String, {index: true});
    property('action', String, {index: true});
    property('userId', Number, {index: true});
    property('objectId', Number, {index: true});
    property('groupId', Number, {index: true});
    property('object', JSON);

    set('defaultSort', 'createdAt DESC');
});

var Media = define('Media', function () {
    property('type', String, {index: true});
    property('userId', Number, {index: true});
    property('groupId', Number, {index: true});
    property('contentIds', JSON);
    property('createdAt', Date);
    property('url', String);
    property('originalUrl', String, {index: true});
    property('width', Number);
    property('height', Number);
    property('resized', []);
    property('encodingKey', String, {index: true});

    set('ignoreNullValues', true);
    set('defaultSort', 'createdAt DESC');
});

var Notification = define('Notification', function () {
    property('userId', Number, {index: true});
    property('createdAt', Date, {index: true, sort: true});
    property('isRead', Boolean, {index: true});
    property('isActioned', Boolean);
    property('url', String);
    property('html', String);

    set('ignoreNullValues', true);
    set('defaultSort', 'count DESC');
});

var ImportStream = define('ImportStream', function () {
    property('groupId', Number, {index: true});
    property('hash', String, {index: true});
    property('type', String, {index: true});
    property('title', String);
    property('query', String);
    property('source', String);
    property('tags', [], {index: true});
    property('interval', Number);
    property('enabled', Boolean, {index: true});
    property('lastRun', Date);

    set('ignoreNullValues', true);
    set('defaultSort', 'title');
});

var Tag = define('Tag', function () {
    property('groupId', Number, {index: true});
    property('userId', Number, {index: true});
    property('published', Boolean, {index: true});
    property('type', String, {index: true});
    property('groupIdByType', String, {index: true});
    property('category', String, {index: true});
    property('name', String, {index: true});
    property('title', String, {index: true});
    property('description', String);
    property('sortOrder', String);
    property('count', Number);
    property('updatedAt', Number);
    property('filter', String);
    property('subscribers', []);
    property('permissions', []);

    set('ignoreNullValues', true);
    set('defaultSort', 'count DESC');
});

var Cache = define('Cache', function () {
    property('pageId', Number, {index: true});
    property('key', String, {index: true});
    property('pageAndKey', String, {index: true});
    property('text', String);
});

var ResetPassword = define('ResetPassword', function() {
    property('createdAt', Date);
    property('token', { type: String, index: true });
});

var Event = define('Event', function() {
    property('groupId', Number, {index: true});
    property('type', String, {index: true});
    property('day', String, {index: true});
    property('week', String, {index: true});
    property('details', JSON);
    property('createdAt', Date);
});
