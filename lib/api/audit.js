module.exports = AuditAPI;

function AuditAPI(hatch){
    this.hatch = hatch;
}

AuditAPI.prototype.track = function track(groupId, eventType, details, cb) {
    var Event = this.hatch.compound.models.Event;

    Event.create({
        groupId: groupId,
        type: groupId + '-' + eventType,
        details: details,
    }, function(err, event) {
        if (cb) {
            cb(err, event);
        }
    });

};

AuditAPI.prototype.dailyEventsBreakdown = function(groupId, eventType, date, cb) {
    var Event = this.hatch.compound.models.Event;

    if (typeof date === 'function') {
        cb = date;
        date = new Date;
    }
    if (date instanceof Date) {
        date = date.getTime();
    }
    var day = Math.floor(date / 86400000);

    if (typeof eventType === 'string') {
        eventType = [eventType];
    }

    var wait = eventType.length, breakdown = [];

    eventType.forEach(function(type) {
        Event.count({day: groupId + '-' + type + '-' + day}, function(err, count) {
            breakdown.push({type: type, count: count});
            wait -= 1;
            if (wait === 0) {
                cb(err, breakdown);
            }
        });
    });
};

AuditAPI.prototype.eventsBreakdown = function(groupId, eventType, cb) {
    var Event = this.hatch.compound.models.Event;

    if (typeof eventType === 'string') {
        eventType = [eventType];
    }

    var wait = eventType.length, breakdown = [];

    eventType.forEach(function(type) {
        Event.count({type: groupId + '-' + type}, function(err, count) {
            breakdown.push({type: type, count: count});
            wait -= 1;
            if (wait === 0) {
                cb(err, breakdown);
            }
        });
    });
};
