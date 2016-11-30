'use strict';
var through = require('through2');
var _ = require('./util.js');
var config = require('./configure/config.js');
var gutil = require('gulp-util');
var spawn = require('child_process').spawn;

module.exports = function () {
    var tinypngPath = config.tinypng;

    return through.obj(function (file, enc, cb) {
        var chunks = [], self = this, onreadable, sp, stdout;

        if (file.isNull() || file.isStream()) {
            this.push(file);
            return cb();
        }

        onreadable = function () {
            var chunk;

            while (null !== (chunk = stdout.read())) {
                chunks.push(chunk);
            }
        };

        if (file.isBuffer()) {
            if (tinypngPath && _.exists(tinypngPath)) {

                sp = spawn('sh', [tinypngPath, file.path], {
                    cwd: file.cwd
                });

                stdout = sp.stdout;
                stdout.on('error', function (err) {
                    self.emit('error', new gutil.PluginError('tinypng', err));
                    return cb();
                });
                stdout.on('readable', onreadable);
                stdout.once('end', function () {
                    stdout.removeListener('readable', onreadable);
                    file.contents = Buffer.concat(chunks);
                    self.push(file);
                    cb();
                });
            } else {
                this.push(file);
                return cb();
            }
        }

    });
};
