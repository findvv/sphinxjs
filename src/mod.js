'use strict';

var through = require('through2');
var m2c = require('./m2c.js');

var gutil = require('gulp-util');
var _ = require('./util.js');
var lang = require('./lang.js');
var config = require('./configure/config.js');

function parser(file, cb) {
    var extname = _.extname(file.path);

    if (_.isJs(extname) && !_.isHtml(extname)) {
        parseJS(file, cb);
    }

    if (_.isHtml(extname)) {
        parseHtml(file, cb);
    }
}

function parseHtml(file) {
    var deps = [],
        depsOrder = {},
        count = 0,
        contents,
        regExp = /<(script).*?(?:(?:src\s*=\s*('[^']+'|"[^"]+"|[^\s\/>]+)(?=.*?data-main))|(?:data-main.*?(?=src\s*=\s*('[^']+'|"[^"]+"|[^\s\/>]+)))|(?:data-main)).*?>([\s\S]*?)<\/\1>/mig;
        // regExp = /<(script)(.*?data-main.*?)>([\s\S]*?)<\/\1>/mig;

    if (file.cache && file.cache.enable) {

        file.cache.getConfig(function (err, config) {
            if (err) {
                config = {};
            }
            file.deps = config.requires || [];
            file.adeps = config.arequires || [];
            file.depsOrder = config.depsOrder || {};
        });

    } else {
        contents = file.contents.toString();

        contents = contents.replace(regExp, function (all, tag, $2, $3, content) {
            var nContent = lang.depsEmbed.wrap(file.path + count),
                ret,
                url = $2 || $3;

            if (url) {
                content = 'require(' + url + ');' + content;
            }

            count++;
            if (_.trim(content).length == 0) {
                return all;
            }
            ret = m2c({
                src: file.path,
                based: file.cwd,
                content: content,
                isWrap: false
            });

            depsOrder[nContent] = ret.deps;
            if (ret.content.replace(/[\s;,]/gm, '')) {
                nContent = nContent + ('\n<script' + ' type="text/javascript">\n' + ret.content + '\n</' + 'script>');
            }

            deps = deps.concat(ret.deps);
            return nContent;

        });
        file.contents = new Buffer(contents);
        file.deps = deps;
        file.depsOrder = depsOrder;
        file.cache.addModuleDeps(file.deps);
        file.cache.addDeps(file.deps);
        file.cache.depsOrder = depsOrder;
    }

}

function parseJS(file, cb) {
    var ret,
        contents,
        regExp = /\'use module\';/gim;

    if (file.cache && file.cache.enable) {
        file.cache.getConfig(function (err, config) {

            if (err) {
                config = {};
            }
            file.deps = config.requires || [];
        });

    } else {
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
            map: config.alias || {},
            compress: config.optimize
        });
        if (ret) {
            file.contents = new Buffer(ret.content);

            file.deps = ret.deps;
            file.cache.addModuleDeps(file.deps);
        }
    }
}

module.exports = function () {
    return through.obj(function (file, enc, cb) {
        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (_.isText(_.extname(file.path))) {
            this.push(file);
            return cb();
        }

        if (file.isBuffer()) {
            try {
                parser(file);

            } catch (e) {
                console.log(file.path);
                return cb(new gutil.PluginError('mod', e));
            }
        }
        this.push(file);
        return cb();
    });
};
