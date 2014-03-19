var csv = require('csv');

module.exports = ExportAPI;

function ExportAPI(hatch) {
    this.hatch = hatch;
}

/**
 * Export data in CSV format for the model matching the specified query.
 *
 * @param  {Model}    model    - model to export data from
 * @param  {Query}    query    - query to retrieve data with
 * @param  {Function} callback - callback function
 */
ExportAPI.prototype.csv = function (model, query, callback) {
    'use strict';
    var str = '';

    // get the first result to build the CSV headers
    model.findOne({ where: query.where }, function (err, obj) {
        if (obj.toPublicObject) {
            obj = obj.toPublicObject();
        }

        var headers = Object.keys(obj).join(',');
        str += headers + '\n';

        // now iterate through the entire data set to build the CSV
        model.iterate(query, function (obj, done) {
            if (obj.toPublicObject) {
                obj = obj.toPublicObject();
            }

            // sanitize the data for CSV output - replace null values with ''
            // fix null values
            Object.keys(obj).forEach(function (key) {
                if (obj[key] === null) {
                    obj[key] = '';
                }
                else if(obj[key]) {
                    obj[key] = obj[key].toString();
                }
            });

            csv().from.array([obj]).to.string(function (data, count) {
                str += data + '\n';
                done();
            });
        }, function (err) {
            if (err) {
                return callback(err);
            }

            callback(null, str);
        });
    });
};

/**
 * Export data in JSON format for the model matching the specified query.
 *
 * @param  {Model}    model    - model to export data from
 * @param  {Query}    query    - query to retrieve data with
 * @param  {Function} callback - callback function
 */
ExportAPI.prototype.json = function (model, query, callback) {
    'use strict';
    var str = '[';

    // now iterate through the entire data set to build the CSV
    model.iterate(query, function (obj, done) {
        if (obj.toPublicObject) {
            obj = obj.toPublicObject();
        }

        str += JSON.stringify(obj) + ',';

        done();
    }, function (err) {
        if (err) {
            return callback(err);
        }

        // trim the last ','
        if (str.length > 1) {
            str = str.substring(0, str.length -1);
        }
        str += ']';

        callback(null, str);
    });
};
