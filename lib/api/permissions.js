var _ = require('underscore');

module.exports = PermissionsAPI;

/**
 * defines the permission API
 * 
 * @param {Application} hatch - hatch application
 */
function PermissionsAPI(hatch) {
    this.hatch = hatch;
    this.permissions = {};
    this.root = new Permission({ name: 'root', title: 'All' });
}

/**
 * Defines a permission object.
 * 
 * @param {JSON} data - seed data
 */
function Permission(data) {
    _.extend(this, data);
    if(!this.permissions) this.permissions = [];
}

/**
 * Register a child permission.
 * 
 * @param  {Permission} permission - permission to register
 */
Permission.prototype.register = function(permission) {
    permission = new Permission(permission);
    this.permissions.push(permission);
};

/**
 * Register a new permission.
 * @param  {Permission} permission - permission to register
 */
PermissionsAPI.prototype.register = function(permission) {
    var parent = this.getParent(permission.name) || this.root;
    parent.register(permission);
};

/**
 * Get the specified permission.
 * 
 * @param  {String}     name - name of the permission to get
 * @return {Permission}      - permission object
 */
PermissionsAPI.prototype.get = function(name) {
    var parent = this.root;
    var i = 0;

    return find();

    function find() {
        var part = name.split('.').slice(0, ++i).join('.');
        var permission = _.find(parent.permissions, function(p) { return p.name === part; });

        if(name.split('.')[i]) {
            parent = permission;
            return find();
        }
        else {
            return permission;
        }
    }
};

/**
 * Get the parent permission of the specified permission route.
 * 
 * @param  {String}     name - permission route - e.g. admin.page.edit.style
 * @return {Permission}      - the parent permission object
 */
PermissionsAPI.prototype.getParent = function(name) {
    if(name.indexOf('.') == -1) {
        return this.root;
    }
    return this.get(name.substring(0, name.lastIndexOf('.')));
};

/**
 * Check whether a permission list contains the specified permission.
 * 
 * @param  {Array}   permissionList - list of permission names
 * @param  {String}  name           - name of the permission to check
 * @return {Boolean}                - true or false
 */
PermissionsAPI.prototype.match = function(permissionList, name) {
    if(!permissionList) return false;
    var found = false;

    _.forEach(permissionList, function(permissionName) {
        if(permissionName == name || name.indexOf(permissionName + '.') > -1) {
            found = true;
        }

        //check for wildcard permissions
        if(name.indexOf('.*') > -1 && new RegExp(name).exec(permissionName)) {
            found = true;
        }
    });

    return found;
};

