'use strict';
var through = require('through2');
var _ = require('./util');
var lang = require('./lang');
var Store = require('./store');
var config = require('./configure/config');
var objectAssign = require('object-assign');
var store = new Store;
var pth = require('path');
var gutil = require('gulp-util');

var dTmpl = {
    js: '<script type="text/javascript" src="{0}"></script>',
    css: '<link rel="stylesheet" type="text/css" href="{0}">'
};

function buildTag(deps) {
    var existsDep = [],
        ret = '',
        tmpl = config.tmpl || dTmpl;

    deps = deps || [];

    deps.forEach(function (v) {

        if (existsDep.indexOf(v) == -1) {
            var extname = _.extname(v),
                rExt = _.getReleaseExt(extname),
                ext = rExt.replace('.', ''),
                nPath = gutil.replaceExtension(v, config.optimize && config.min ? ('.min' + rExt) : rExt);

            if (_.isJs(extname) || _.isCss(extname)) {
                ret += tmpl[ext].replace(/\{\d{1}\}/, '/' + nPath) + '\n\t';
                existsDep.push(v);
            }
        }
    });

    return ret;
}

function addCacheDeps(a, b) {
    if (a && a.cache && b) {
        if (b.cache) {
            a.cache.mergeDeps(b.cache);
        }
        a.cache.addDeps(b.path || b);
    }
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

        if (file.isBuffer()) {
            store.add(file.path, {
                file: file,
                piped: false
            });

            cb();
        }
    }, function (cb) {
        var stream = this;

        // 错误处理
        function error(message) {
            var util = require('gulp-util');

            cb(new util.PluginError('embed', message));
        };

        function embed(obj) {
            var file, contents, dirname, cwd;

            if (obj.piped) {
                return;
            }

            file = obj.file;

            // 非图片
            if (!_.isText(_.extname(file.path)) || file.cache.enable) {
                obj.piped = true;
                stream.push(file);
                return;
            }

            contents = file.contents.toString();
            dirname = _.dirname(file.path);
            cwd = file.cwd;

            contents = contents.replace(lang.reg, function (all, type, depth, url, extra) {
                var info, obj, ret = all,
                    message;

                url = url.replace(/\\\'/ig, '');
                info = _.uri(url, dirname, cwd);
                obj = store.find(info.release);
                if (obj && !obj.piped) {
                    embed(obj);
                }

                try {
                    switch (type) {
                        case 'uri':
                            if (info.url) {
                                ret = info.quote + info.url + info.quote;
                            } else {
                                ret = url;
                            }
                            break;
                        case 'require':
                            if (info.id) {
                                ret = info.quote + info.id + info.quote;
                            } else {
                                ret = url;
                            }
                            break;
                        case 'embed':
                        case 'jsEmbed':

                            if (obj) {
                                ret = obj.file.contents;

                                addCacheDeps(file, obj.file);

                                if (!_.isText(info.rExtname)) {

                                    // 非文本文件 buffer
                                    ret = info.quote + _.base64(ret, info.rExtname) + info.quote;
                                } else {
                                    // 文本文件必须 toString()

                                    ret = ret.toString();
                                    if (type === 'jsEmbed' &&
                                        !_.isJsLike(info.rExtname) &&
                                        !_.isJson(info.rExtname)) {
                                        ret = JSON.stringify(ret);
                                    }
                                }
                            } else {

                                message = 'unable to embed non-existent file [' + url + '] in [' + file.path + ']';
                            }
                           // ret = all;
                            break;
                        case 'depsEmbed':
                            var deps = [],
                                adeps = [];

                            ret = '';

                            if (!file.depsOrder) {
                                break;
                            }

                            deps = file.depsOrder[all] || [];
                            // console.log(deps);
                            adeps = getAllDeps(deps, file);

                            ret = buildTag(adeps) || '';
                            break;
                    }

                    if (message) {
                        error(message);
                    }
                } catch (e) {
                    error(e.message + ' in [' + file.path + ']');
                }

                return ret;
            });

            file.contents = new Buffer(contents);

            obj.piped = true;
            stream.push(file);
        }

        function getAllDeps(deps, file) {
            var adeps = [],
                cwd = config.cwd;

            deps.forEach(function (v) {
                var uriInfo = _.uri(v, cwd, cwd),

                    tmp = store.find(uriInfo.release),

                    cacheAdeps,

                    tFile;

                // console.log(v);

                if (tmp) {
                    tFile = tmp.file;
                    // console.log('____________');
                    // console.log(tFile.cache.arequires);
                    cacheAdeps = tFile.cache.arequires;
                    if (cacheAdeps.length == 0) {
                        if (tFile.dStatus) {
                            throw new Error(tFile.path + '和' + file.path + '存在循环依赖');
                        }

                        tFile.dStatus = 1;

                        var xdeps = getAllDeps(tFile.deps || [], tFile);

                        adeps = adeps.concat(xdeps);

                        tFile.dStatus = 0;
                    } else {
                        adeps = adeps.concat(cacheAdeps);
                    }
                }

                adeps.push(v);
            });

            file.adeps = _.uniq(adeps);
            file.cache.arequires = file.adeps;
            file.cache.addDeps(file.adeps || []);
            return adeps;
        }

        function analysis(obj) {
            var cwd, file;

            file = obj.file;
            cwd = file.cwd;
            if (file.adeps) {
                return file.adeps;
            };

            function recursion(file, isCache, map) {
                var subpath = file.relative,
                    deps;

                if (!isCache) {
                    map = map || [];
                    if (file.deps) {
                        deps = file.deps;
                    } else {
                        return map;
                    }
                } else {
                    map = map || {};
                    if (!_.isEmpty(file.cache.deps)) {
                        deps = Object.keys(file.cache.deps);

                    } else {
                        return map;
                    }
                }

                for (var ci, info, rfile, len = deps.length, tmp, i = len - 1; ci = deps[i], i >= 0; i--) {
                    if (isCache) {
                        info = _.uri(pth.relative(cwd, ci), cwd, cwd);
                    } else {
                        info = _.uri(ci, cwd, cwd);
                    }

                    tmp = store.find(info.release);

                    if (tmp) {
                        rfile = tmp.file;
                        if (rfile) {
                            if (!isCache) {
                                if ((rfile.deps && rfile.deps.indexOf(ci) >= 0)) {
                                    error('文件[' + subpath + ']和文件[' + ci + ']循环引用');
                                }
                            } else {

                                if ((rfile.cache && ci in rfile.cache.deps)) {
                                    error('文件[' + subpath + ']和文件[' + ci + ']循环引用');
                                }
                            }
                        }
                        if (!isCache) {
                            map.unshift(ci);
                            if (_.isJs(_.extname(ci))) {
                                recursion(rfile, isCache, map);
                            }
                        } else {

                            map = objectAssign(map, rfile.cache.deps);
                            recursion(rfile, isCache, map);
                        }
                    }
                }
                if (!isCache) {
                    for (var j = 0, ko = {}, cj; cj = map[j]; j++) {
                        if (cj in ko) {
                            map.splice(j, 1);
                        } else {
                            ko[cj] = true;
                        }
                    }
                }

                return map;

            }

            file.adeps = recursion(file, false);
            file.cache.arequires = file.adeps;
            file.cache.addDeps(file.adeps || []);
            file.cache.addDeps(recursion(file, true));
        }

        // store.each(function (obj) {
        //     analysis(obj);
        // });
        store.each(function (obj) {
            embed(obj);
        });

        // 清空
        store.clear();

        return cb();
    });
};
