//
// Hatch.js is a CMS and social website building framework built in Node.js 
// Copyright (C) 2013 Inventures Software Ltd
// 
// This file is part of Hatch.js
// 
// Hatch.js is free software: you can redistribute it and/or modify it under the terms of the
// GNU Affero General Public License as published by the Free Software Foundation, version 3
// 
// Hatch.js is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY;
// without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
// 
// See the GNU Affero General Public License for more details. You should have received a copy of the GNU
// General Public License along with Hatch.js. If not, see <http://www.gnu.org/licenses/>.
// 
// Authors: Marcus Greenwood, Anatoliy Chakkaev and others
//

exports.defaultPath = 'terms';

exports.defaultPage = {
    title: 'Terms and conditions',
    grid: '01-one-column',
    columns: [{size: 12, widgets: [1, 2]}, {size: 12, widgets: [3]}],
    widgets: [
        {id: 1, type: 'core-widgets/group-header'},
        {id: 2, type: 'core-widgets/mainmenu'},
        {id: 3, type: 'core-widgets/static', settings: { title: 'Terms and conditions', content: 'Any information you enter on this website will only be used by this website, unless otherwise specifically specified on the site or unless you have provided specific permission for us to share your information with other third parties or we can’t withhold it without breaking the law. We may use Google Analytics to monitor our site traffic. This does not allow us to identify individuals. You can read their <a href="http://www.google.com/privacy.html">privacy policy here</a>. We keep our data about you secure, but if anything goes wrong we’ll let you know.' }}
    ]
};
