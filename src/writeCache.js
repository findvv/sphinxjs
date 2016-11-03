'use strict';
var through = require('through2');

module.exports = function () {
    return through.obj(function (file, enc, cb) {

        if (file.cache) {
            file.cache.save(file.contents.toString(), function () {
                cb(null, file);
            });
        } else {
            cb(null, file);
        }
    });
};
