exports.registration = function(user) {
    this.locals.user = user;
    this.send({
        to: user.email,
        subject: 'Welcome to Hatch'
    });
};

exports.resetpassword = function(user, compound, params) {
    this.locals.user = user;
    var sp = compound.hatch.page.get('resetpassword');
    this.locals.resetPasswordUrl = sp.path(params.group, {fullPath: true, token: params.token});
    console.log(this.locals.resetPasswordUrl);
    this.send({
        to: user.email
    }, console.log);
};
