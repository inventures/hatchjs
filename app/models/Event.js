module.exports = function(compound, Event) {

    Event.beforeCreate = function(done, event) {
        var now = Date.now();
        event.createdAt = new Date;
        event.day = event.type + '-' + Math.floor(now / 86400000);
        event.week = event.type + '-' + Math.floor(now / 86400000 / 7);
        done();
    };

};
