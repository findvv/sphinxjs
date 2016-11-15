'use strict';
var through = require('through2');
var _ = require('./util.js');

module.exports = function () {
    return through.obj(function (file, enc, cb) {
        var contents;

        if (file.cache) {
            if (_.isText(_.extname(file.path))) {
                contents = file.contents.toString();
            } else {
                contents = file.contents;
            }
            file.cache.save(contents, function () {
                cb(null, file);
            });
        } else {
            cb(null, file);
        }
    });
};
