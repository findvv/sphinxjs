'use strict';
var through = require('through2');
var crypto = require('crypto');
var Store = require('./store.js');
var cache = new Store;



function md5(str) {
    return crypto
        .createHash('md5')
        .update(str)
        .digest('hex');
}

module.exports = function () {
    return through.obj(function (file, enc, cb) {
        var str,
            key;

        if (file.isNull()) {
            return cb();
        }

        if (file.isStream()) {
            this.push(file);
            return cb();
        }

        if (file.isBuffer()) {
            // str = md5(file.contents);
            // key = file.path;

            // if (cache.find(key) !== str) {
            //     cache.add(key, str);
            //     this.push(file);
            // }

            if (!file.cache.enable) {
                this.push(file);
            } else {
                // todo 确定 有缓存但是输出目录没有的问题;
            }

            return cb();
        }
    }, function (cb) {
        return cb();
    });
};
