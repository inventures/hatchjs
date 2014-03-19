module.exports = function (compound) {
    return [
        require('ejs-ext'),
        require('jugglingdb'),
        require('seedjs'),
        require('co-assets-compiler'),
        require('co-mailer')
    ];
};

