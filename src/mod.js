'use strict';

var through = require('through2');
var m2c = require('./m2c.js');

var gutil = require('gulp-util');
var _ = require('./util.js');
var lang = require('./lang.js');
var config = require('./configure/config.js');

function parser(file) {
    var ret;
    var extname = _.extname(file.path);

    if (_.isJs(extname) && !_.isHtml(extname)) {
        ret = parseJS(file);
    }

    if (_.isHtml(extname)) {
        ret = parseHtml(file);
    }

    if (ret) {
        file.contents = new Buffer(ret.content);

        file.deps = ret.deps;
    }
}

function parseHtml(file) {
    var deps = [],
        depsOrder = {},
        count = 0,
        contents,
        regExp = /<(script) .*?data-main.*?>([\s\S]*?)<\/\1>/mig;

    contents = file.contents.toString();

    contents = contents.replace(regExp, function () {
        var content = arguments[2],
            nContent = lang.depsEmbed.wrap(file.path + count),
            ret;

        count++;

        ret = m2c({
            src: file.path,
            based: file.cwd,
            content: content,
            isWrap: false
        });

        depsOrder[nContent] = ret.deps;
        if (ret.content.replace(/[\s;,]/gm, '')) {
            nContent += '\r<script' + ' type="text/javascript">\n' + ret.content + '\n</' + 'script>';
        }

        deps = deps.concat(ret.deps);
        return nContent;

    });

    file.contents = new Buffer(contents);
    file.deps = deps;
    file.depsOrder = depsOrder;
}

function parseJS(file) {
    var ret,
        contents,
        regExp = /\'use module\';/gim;

    contents = file.contents.toString();

    if (!(regExp.test(contents))) {
        return;
    }

    ret = m2c({
        src: file.path,
        based: file.cwd,
        content: contents.replace(regExp, ''),
        isWrap: true,
        ns: config.namespace,
        map: config.alias || {}
    });

    return ret;
}

module.exports = function () {
    return through.obj(function (file, enc, cb) {

        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isBuffer()) {
            try {
                parser(file);
            } catch (e) {
                return cb(new gutil.PluginError('mod', e.message));
            }
        }

        this.push(file);
        return cb();

    });
};
