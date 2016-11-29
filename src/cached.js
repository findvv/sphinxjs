'use strict';
var through = require('through2');
var crypto = require('crypto');
var Store = require('./store.js');
var config = require('./configure/config.js');
var cache = new Store;
var pth = require('path');
var _ = require('./util.js');
var gutil = require('gulp-util');
var fs = require('fs');

function md5(str) {
    return crypto
        .createHash('md5')
        .update(str)
        .digest('hex');
}

module.exports = function () {
    return through.obj(function (file, enc, cb) {
        var dest = config.dest,
            path,
            optimize = config.optimize,
            self = this;

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
                return cb();

            } else {
                var extname = _.extname(file.path);

                if (_.existsExtMap(extname)) {
                    file.path = gutil.replaceExtension(file.path, _.getReleaseExt(extname));
                }

                path = pth.resolve(config.cwd, dest, file.relative);

                if (optimize) {
                    var _extname = _.extname(path);

                    path = path.replace(_extname, '.min' + _extname);
                }

                fs.exists(path, function (flag) {
                    if (!flag) {
                        self.push(file);
                    }
                    cb();
                });
                // todo 确定 有缓存但是输出目录没有的问题;
            }

        }
    }, function (cb) {
        return cb();
    });
};
