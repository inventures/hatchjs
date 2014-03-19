var _ = require('underscore');

module.exports = UsersController;

function UsersController() {}

UsersController.prototype.create = function(c) {
    var User = c.User;
    var user = c.req.user || new User();

    user.username = c.body.username.toLowerCase();
    user.email = c.body.email.toLowerCase();
    user.password = c.body.password;
    user.hasPassword = c.body.hasPassword;
    user.type = 'registered';

    //validation
    if (c.body.terms !== 'accepted') {
        return c.sendError({ message: 'Please accept the terms and conditions'});
    }

    //check for any more required custom fields
    if(!user.validateGroupProfileFields(c.req.group)) {
        user.type = 'temporary';
    }

    c.compound.hatch.hooks.hook(c, 'User.beforeRegister', { user: user }, function() {
        //save to database and continue
        user.save(function(err, user) {
            if (err) {
                c.sendError({ message: user.errors });
            } else {
                //get the newly created user
                User.all({where: { username: user.username }}, function (err, users) {
                    var user = users[0];

                    c.compound.hatch.hooks.hook(c, 'User.afterRegister', { user: user }, function() {
                        // authenticate user
                        c.req.session.userId = user.id;

                        if (user.type === 'temporary') {
                            c.send({ redirect: c.specialPagePath('register') + '?redirect=' + c.pathTo.join() });
                        } else {
                            user.notify('registered');
                            c.send({ redirect: c.pathTo.join() });
                        }
                    });
                });
            }
        });
    })
};

UsersController.prototype.update = function(c) {
    var User = c.User;
    var user = c.req.user;

    //check passwords
    if(c.req.body.password) {
        if(user.type !== 'temporary' && user.password && User.calcSha(c.req.body.currentPassword) != user.password) {
            return c.sendError({ message: 'Your current password is incorrect' });
        }
        if(c.req.body.password != c.req.body.confirmPassword) {
            return c.sendError({ message: 'Your password and password confirmation do not match' });
        }
    }

    //update user details
    if(c.req.body.username) user.username = c.req.body.username;
    user.firstname = c.req.body.firstname;
    user.lastname = c.req.body.lastname;
    user.oneLiner = c.req.body.oneLiner;
    user.email = c.req.body.email;
    user.avatar = c.req.body.avatar;

    // fix avatars which are saved as a string
    if (typeof user.avatar === 'string' && user.avatar.indexOf('{') === 0) {
        user.avatar = JSON.parse(user.avatar);
    }

    if(!user.mailSettings) user.mailSettings = {};

    /*
    //mail settings
    var mailTypes = c.api.mailer.getTypes();
    if(c.req.body.mailSettings) {
        Object.keys(mailTypes).forEach(function(mailType) {
            var checked = c.req.body.mailSettings[mailType] ? 'true' : 'false';

            console.log(mailType + ' = ' + checked)
            user.mailSettings[mailType] = checked;
        });
    }
    */

    if(!user.otherFields) user.otherFields = {};

    //TODO: should custom fields go on membership or be global?

    //update custom fields
    Object.keys(c.req.body).forEach(function(index) {
        if(index.indexOf('custom-') == 0) {
            user.otherFields[index.replace('custom-', '')] = c.req.body[index];
        }
    });

    //validate custom fields
    if(!user.validateGroupProfileFields(c.req.group)) {
        return c.sendError({ message: 'Please fill in all mandatory fields' });
    }

    if(c.req.body.password || (user.type === 'temporary' && !user.hasPassword)) user.password = c.req.body.password;

    //standard validation
    if(!user.isValid() && Object.keys(user.errors).length > 0) {
        return c.sendError({ message: user.errors });
    }

    //change temporary user to registered user
    if(user.type === 'temporary') user.type = 'registered';

    //finally save and return
    user.save(function() {
        c.compound.hatch.hooks.hook(c, 'User.afterUpdate', { user: user }, function() {
            c.send({
                status: 'success',
                icon: 'ok',
                message: 'Account details saved successfully'
            });
        });
    });
};

UsersController.prototype.updatePassword = function (c) {
    var user = c.req.user;

    //check passwords
    if(c.req.body.password) {
        if(user.type !== 'temporary' && user.password && c.User.calcSha(c.req.body.currentPassword) != user.password) {
            return c.sendError({ message: 'Your current password is incorrect' });
        }
        if(c.req.body.password != c.req.body.confirmPassword) {
            return c.sendError({ message: 'Your password and password confirmation do not match' });
        }
    }

    user.password = c.req.body.password;
    user.save(function (err) {
        if (err) {
            return c.sendError(err);
        }

        c.send({
            status: 'success',
            icon: 'ok',
            message: 'Password saved successfully'
        });
    });
};

UsersController.prototype.destroy = function (c) {
    c.req.user.destroy(function () {
        delete c.req.session.userId;
        c.redirect(c.req.group.path);
    });
};

UsersController.prototype.join = function(c) {
    if (c.params.invitationCode && !c.req.user) {
        c.req.session.invitationCode = c.params.invitationCode;
    }
    if (!c.req.user) {
        return c.redirect(c.req.group.path + '#register');
    }
    var invitationCode = c.req.params.invitationCode ||
        c.req.body.invitationCode || c.req.session.invitationCode;

    c.req.user.joinGroup(c.req.group, invitationCode, function () {
        //redirect
        c.redirect('//' + c.req.group.url);
    });
}

UsersController.prototype.hovercard = function(c) {
    var User = c.User;
    User.find(c.params.id, function(err, user) {
        user.isFollowed = _.find(c.req.user &&
            c.req.user.ifollow || [], function(id) { return id == user.id; });

        c.locals.user = user;
        c.render({ layout: false });
    });
}

UsersController.prototype.rejectInvitation = function(c) {
    c.req.user.rejectInvitation(c, function() {
        c.redirect(c.req.group.path);
    });
};

UsersController.prototype.resetPassword = function resetPassword(c) {
    var User = c.User;

    //get the user to send the password reset link to
    User.findOne({ where: { email: c.body.email.toLowerCase() }}, function (err, user) {
        if (user) {
            sendResetLink(user);
        } else {
            User.findOne({ where: { username: c.body.email.toLowerCase() }}, function (err, user) {
                if (user) {
                    sendResetLink(user);
                } else {
                    c.error({ message: "Username or email address not found."});
                }
            });
        }
    });

    function sendResetLink(user) {
        user.resetPassword(c, function () {
            c.hatch.hooks.hook(c, 'User.afterResetPassword', { user: user }, function() {
                c.send({
                    status: 'success',
                    icon: 'info-sign',
                    message: 'A reset password link has been sent to your registered email address.'
                });
            });
        });
    }
};

UsersController.prototype.resetPasswordChange = function(c) {
    var ResetPassword = c.ResetPassword;

    ResetPassword.auth(c.req.body.token, function (err, user) {
        if(err) return c.error({ message: err.message });

        if (c.body.password) {
            user.updateAttribute('password', c.req.body.password, function (err) {
                c.send({
                    status: 'success',
                    icon: 'info-sign',
                    message: 'Your password has been successfully reset. You may now login.'
                });
            });
        } else {
            c.send({status: 'error', message: "Please enter a valid password"});
        }
    });
};
