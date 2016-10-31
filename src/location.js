'use strict';
var through = require('through2');
var _ = require('./util');
var lang = require('./lang');

function location(file, cb) {
    var contents, dirname, cwd;

    contents = file.contents.toString();
    dirname = _.dirname(file.path);
    cwd = file.cwd;

    contents = contents.replace(lang.reg, function (all, type, depth, url, extra) {
        var info, ret = all;

        info = _.uri(url, dirname, cwd);

        try {
            switch (type) {
                case 'uri':
                    if (info.url && info.exists) {
                        ret = info.quote + info.url + info.quote;
                    } else {
                        ret = url;
                    }
                    break;
                case 'require':
                    if (info.id && info.exists) {
                        ret = info.quote + info.id + info.quote;
                    } else {
                        ret = url;
                    }

                    break;
            }
        } catch (e) {
            var util = require('gulp-util');

            cb(new util.PluginError('location', e.message + ' in [' + file.path + ']'));
        }

        return ret;
    });

    file.contents = new Buffer(contents);

}

module.exports = function () {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.push(file);
            return cb();
        }

        if (_.isImage(_.extname(file.path))) {
            this.push(file);
            return cb();
        }
        if (file.isBuffer()) {

            location(file, cb);

            this.push(file);

            return cb();
        }
    });
};
