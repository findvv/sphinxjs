'use strict';
var mergeStream = require('merge-stream');
var gulp = require('../../gulp');
// 错误处理
var plumber = require('gulp-plumber');
var notify = require('gulp-notify');
var filter = require('gulp-filter');
var sass = require('../sm-sass.js');
var inline = require('../inline');
var embed = require('../embed');
var copy = require('../copy');
// var deps = require('../deps');
var _ = require('../util');
var importer = require('../sass').importer;
var fixImport = require('../sass').fixImport;
//var delSphinx = require('../sass').delSphinx;

var ext = require('../ext');
// var props = require('../props');
var cached = require('../cached');
var mail = require('../mail');
var ifElse = require('gulp-if-else');
var getContents = require('../getContents.js');
var writeCache = require('../writeCache.js');
var location = require('../location.js');
var mod = require('../mod.js');
var tmpl = require('gulp-template');
var tinypng = require('../tinypng.js');
var map = require('../map.js');

// 数组去重
function unique(array) {
    var r = [];

    for (var i = 0, l = array.length; i < l; i++) {
        for (var j = i + 1; j < l; j++) {
            if (array[i] === array[j]) {
                j = ++i;
            }
        }
        r.push(array[i]);
    }
    return r;
}

function getCacheFilter() {
    return filter(function (file) {
        return !(file.cache && file.cache.enable);
    }, {
        restore: true
    });
}

function Base(path, conf) {
    this._path = path;
    this._optimize = conf.optimize;
    this._cwd = conf.cwd;
    this._dest = conf.dest;
    this._lastRun = conf.lastRun;
    this._sourcemap = conf.sourcemap;
    this._es6 = conf.es6;
    this.conf = conf.config || require('../configure/config.js');
}

Base.prototype = {
    /*
     * 返回 stream
     */
    get stream() {
        var cacheFilter, stream = mergeStream();

        stream = this.src(stream).pipe(getContents(this._optimize));

        if (this.conf.error) {
            stream = stream
                .pipe(plumber({
                    errorHandler: notify.onError(function (error) {
                        var message = '[' + error.plugin + ']',
                            file, formatted;

                        if (error.name) {
                            message += error.name + ':';
                        }

                        formatted = error.messageFormatted || error.message;

                        message += ' "' + formatted + '" ';
                        if (file = (error.file || error.fileName)) {
                            message += 'in [' + file + ']';
                        }

                        mail.collectMessage(message);
                        return message;
                    }.bind(this))
                }));
        }

        this.cacheFilter = getCacheFilter();

        stream = stream.pipe(this.cacheFilter);
        // 编译
        stream = this.compile(stream);
        if (this._optimize) {
            stream = this.optimizeByHandler(stream, ['image']);
            stream = this.lang(stream);
            cacheFilter = getCacheFilter();
            stream = stream.pipe(cacheFilter);
            stream = this.optimizeByHandler(stream, null, ['image']);
            stream = stream.pipe(cacheFilter.restore);
        } else {
            stream = this.lang(stream);
        }

        // // 拷贝副本
        // if (this._optimize) {
        //     stream = stream
        //         .pipe(copy());
        // }

        stream = this.postrelease(stream);
        stream = this.dest(stream, this._optimize);

        // // 优化压缩
        // if (this._optimize) {
        //     stream = stream
        //         .pipe(copy.restore())
        //         .pipe(getContents(this._optimize));
        //     // 恢复文件，并释放内存
        //     this.cacheFilter = filter(function (file) {
        //         return !(file.cache && file.cache.enable);
        //     }, {
        //         restore: true
        //     });

        //     stream = stream.pipe(this.cacheFilter);
        //     stream = this.optimize(stream);
        //     stream = this.lang(stream);
        //     stream = this.postrelease(stream);
        //     stream = this.dest(stream, true);
        // }

        stream.on('finish', function (e) {
            mail.send('【sphinx release Error】');
        }.bind(this));

        return stream;
    },

    // 对 compile、optimize、postrelease 的封装
    job: function (stream, type, list) {
        var handlers = list || [];

        if (!type) {
            return stream;
        }
        this.handler = this.handler || {};
        if (handlers.length == 0) {
            handlers = Array.prototype.concat(
                Object.keys(Base.handler),
                Object.keys(this.handler)
            );
        }

        handlers = unique(handlers);

        handlers.forEach(function (key) {
            var fileFilter = filter(function (file) {
                var f = ((this.handler[key] && this.handler[key].filter) ||
                    (Base.handler[key] && Base.handler[key].filter));

                return f && f.call(this, file.path);
            }.bind(this), {
                restore: true
            });

            stream = stream.pipe(fileFilter);
            if (Base.handler[key] && Base.handler[key][type]) {
                stream = Base.handler[key][type].call(this, stream);
            }
            if (this.handler[key] && this.handler[key][type]) {
                stream = this.handler[key][type].call(this, stream);
            }
            stream = stream.pipe(fileFilter.restore);
        }.bind(this));

        return stream;
    },

    // 读取
    src: function (stream) {
        if (this._path.length > 0) {
            // stream.add(gulp.src(this._path, {since: this._lastRun}));
            stream.add(gulp.src(this._path, {
                cwd: this._cwd,
                cwdbase: true
            }));
        }

        // stream = stream.pipe(props());

        return stream;
    },

    // 编译
    compile: function (stream) {
        return this.job(stream, 'compile');
    },

    optimizeByHandler: function (stream, include, exclude) {
        var list = [],
            result = [];

        list = Array.prototype.concat(
            Object.keys(Base.handler),
            Object.keys(this.handler)
        );

        list = unique(list);

        include = include || list;
        exclude = exclude || [];

        list.forEach(function (v) {
            if (include.indexOf(v) > -1 && exclude.indexOf(v) == -1) {
                result.push(v);
            }
        });

        return this.job(stream, 'optimize', result);
    },

    // 压缩
    optimize: function (stream, handler) {

        return this.job(stream, 'optimize', handler);
    },

    // 语言转化
    lang: function (stream) {
        stream = stream
            .pipe(mod(this._optimize))
            .pipe(inline())
            .pipe(this.cacheFilter.restore)
            .pipe(embed(this._optimize));
        return stream;
    },

    // 编译后处理器
    postrelease: function (stream) {
        return this.job(stream, 'postrelease');
    },

    // 写文件
    dest: function (stream, flag) {
        var filterStream;
        var rename;

        // flag 是否更改文件名生成 .min 文件
        if (flag) {

            rename = require('gulp-rename');
            filterStream = filter(function (file) {
                var path = file.path,
                    extname = _.extname(path);

                return _.isJs(extname) || _.isCss(extname) || _.isImage(extname);
            }, {
                restore: true
            });

            stream = stream.pipe(filterStream);

            stream = stream.pipe(rename(function (path) {
                path.extname = '.min' + _.getReleaseExt(path.extname);
                return path;
            }));
            stream = stream.pipe(filterStream.restore);
        }

        return stream
            .pipe(writeCache())
            .pipe(cached(flag))
            .pipe(map())
            .pipe(gulp.dest(this._dest, {
                cwd: this._cwd
            }));
    },

    destory: function () {}
};

// 默认处理器
Base.handler = {
    js: {
        filter: function (path) {
            var extname = _.extname(path);

            return _.isJs(extname);
        },

        compile: function (stream) {
            return stream
                .pipe(ifElse(this._es6, function () {
                    var es6 = require('../es6');

                    return es6();
                }));
        },

        optimize: function (stream) {
            var uglify = require('gulp-uglify');

            // js 文件压缩
            // todo 设置参数
            return stream
                .pipe(uglify({
                    compress: {
                        sequences: false
                    }
                }));
        }
    },
    css: {

        filter: function (path) {
            var extname = _.extname(path);

            return _.isCss(extname);
        },

        compile: function (stream) {
            var scssFilter;

            scssFilter = filter(function (file) {
                var extname = _.extname(file.path);

                return extname === ext.scss || extname === ext.sass;
            }, {
                restore: true
            });

            return stream
                .pipe(ifElse(this._sourcemap, function () {
                    var sourcemaps = require('gulp-sourcemaps');

                    return sourcemaps.init();
                }))

            .pipe(scssFilter)
                .pipe(fixImport())

            .pipe(sass({
                importer: importer(this._cwd),
                includePaths: [this._cwd],
                outputStyle: 'expanded'
            }))

            //.pipe(delSphinx())
            .pipe(ifElse(this._sourcemap, function () {
                    var sourcemaps = require('gulp-sourcemaps');

                    return sourcemaps.write();
                }))
                .pipe(scssFilter.restore);
        },

        optimize: function (stream) {
            var minifyCss = require('gulp-clean-css');

            // css 文件压缩 todo 设置参数
            return stream
                .pipe(minifyCss({
                    advanced: false,
                    aggressiveMerging: true,
                    processImport: false, // 禁止import
                    mediaMerging: true, // 合并@media规则
                    roundingPrecision: -1 // 禁止四舍五入
                }));
        }
    },

    html: {

        filter: function (path) {
            var extname = _.extname(path);

            return _.isHtml(extname);
        },

        compile: function (stream) {
            return stream;
        },
        optimize: function (stream) {
            return stream;
        }
    },

    image: {

        filter: function (path) {
            var extname = _.extname(path);

            return _.isImage(extname);
        },

        compile: function (stream) {
            return stream;
        },

        optimize: function (stream) {
            return stream.pipe(tinypng());
        }
    },
    tmpl: {
        filter: function (path) {
            var extname = _.extname(path);

            return extname === ext.tmpl;
        },

        compile: function (stream) {
            return stream
                .pipe(tmpl.precompile({
                    variable: 'obj'
                }));
        },

        optimize: function (stream) {
            return stream;
        }
    }
};

Base.prototype.constructor = Base;

module.exports = Base;
