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
var Vinyl = require('Vinyl');
var map = {};


module.exports = function (optimize) {
    return through.obj(function (file, enc, cb) {

        if (file.isNull()) {
            return cb();
        }

        if (file.isStream()) {
            this.push(file);
            return cb();
        }

        if (file.isBuffer()) {
            if (file.cache) {
                map[file.relative] = {
                    requires: file.cache.requires,
                    inlines: Object.keys(file.cache.deps).map(function (v) {
                        return pth.relative(file.cwd, v);
                    })
                };

            }
            this.push(file);
            return cb();

        }
    }, function (cb) {
        var dest = config.dest,
            existsMap,
            file;

        try {
            existsMap = require(pth.join(dest, 'map.json')) || {};
        } catch (e) {
            existsMap = {};
        }

        map = Object.assign(existsMap, map);

        file = new Vinyl({
            cwd: config.cwd,
            base: '/',
            path: '/map.json',
            contents: new Buffer(JSON.stringify(map, null, 4))
        });

        this.push(file);

        return cb();
    });
};
