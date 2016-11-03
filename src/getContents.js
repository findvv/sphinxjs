'use strict';
var Cache = require('./cache/cache');
var through = require('through2');
var fs = require('graceful-fs');
var stripBom = require('strip-bom');

function readFile(file, onRead) {

    file.cache.check().then(function (flag) {
        if (flag) {
            onReadFile(null, new Buffer(file.cache.contents));
            //file.cache.getContents(onReadFile);
        } else {
            if (file.isNull()) {
                fs.readFile(file.path, onReadFile);
            } else {
                onRead();
            }
        }
    });

    function onReadFile(readErr, data) {
        if (readErr) {
            return onRead(readErr);
        }
        // console.log(data.toString());
        file.contents = data;
        onRead();
    }
}

function readLink(file, onRead) {
    fs.readlink(file.path, onReadlink);

    function onReadlink(readErr, target) {
        if (readErr) {
            return onRead(readErr);
        }

        // Store the link target path
        file.symlink = target;

        onRead();
    }
}
function readDir(file, onRead) {
    onRead();
}

module.exports = function (optimize) {
    return through.obj(function (file, enc, callback) {
        var cache;

        if (file.isDirectory()) {
            return readDir(file, onRead);
        }

        if (file.stat && file.stat.isSymbolicLink()) {
            return readLink(file, onRead);
        }

        cache = new Cache(file.path, file.stat.mtime.getTime(), optimize);

        Object.defineProperty(file, 'cache', {
            writable: true,
            configurable: false,
            value: cache
        });

        function onRead(readErr) {
            callback(readErr, file);
        }

        return readFile(file, onRead);

    });
};

function defineContents(file) {
    var descriptor = Object.getOwnPropertyDescriptor(file.constructor.prototype, 'contents');

    var cache = new Cache(file);

    Object.defineProperty(file, 'cache', {
        writable: true,
        configurable: false,
        value: cache
    });

    Object.defineProperty(file, 'contents', {
        get: function () {
            if (cache.check()) {
                return new Buffer(cache.contents);
            }
            return descriptor.get.call(this);
        },
        set: function (val) {
            descriptor.set.call(this, val);
        }
    });
};