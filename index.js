'use strict';
var gulp = require('./gulp');
var gutil = require('gulp-util');
var chalk = gutil.colors;
var prettyTime = require('pretty-hrtime');
var config = require('./src/configure/config.js');
var ifElse = require('gulp-if-else');
var bs;

function createRelease(Solution, optimize) {
    return function (cb) {
        var glob = config.glob;

        return new Solution(glob, {
                cwd: config.cwd,
                dest: config.dest,
                optimize: optimize,
                // lastRun: gulp.lastRun('release'),
                sourcemap: config.sourcemap
                    // es6: config.get('es6')
            })
            .stream
            .pipe(ifElse(bs && config.live, function () {
                return bs.stream({
                    match: '**/*.*'
                });
            }));
    };
}

function releaseSeries(Solution) {
    var fns = [];

    fns.push(createRelease(Solution));

    if (config.optimize) {
        fns.push(createRelease(Solution, true));
    }
    return gulp.series(fns);
}

function execute(Solution) {

    gulp.on('start', function (e) {
        if (e.name === '<anonymous>') {
            return;
        }
        gutil.log('Starting', '\'' + chalk.cyan(e.name) + '\'...');
    });
    gulp.on('stop', function (e) {
        var time;

        if (e.name === '<anonymous>') {
            return;
        }

        time = prettyTime(e.duration);

        gutil.log(
            'Finished', '\'' + chalk.cyan(e.name) + '\'',
            'after', chalk.magenta(time)
        );
    });
    gulp.on('error', function (e) {
        var msg, time;

        if (e.name === '<anonymous>') {
            return;
        }

        msg = formatError(e);
        time = prettyTime(e.duration);

        gutil.log(
            '\'' + chalk.cyan(e.name) + '\'',
            chalk.red('errored after'),
            chalk.magenta(time)
        );
        gutil.log(msg || e.error.stack);
        process.exit(1);
    });

    gulp.task('release', releaseSeries(Solution));

    gulp.task('server', gulp.series([
        function (cb) {
            config.error = true;
            cb();
        },
        'release',
        function (cb) {
            var opts = {
                    open: 'external',
                    server: {
                        baseDir: require('path').join(config.cwd, config.dest),
                        directory: true,
                        middleware: [
                            function (req, res, next) {
                                res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
                                res.setHeader('Expires', '-1');
                                res.setHeader('Pragma', 'no-cache');
                                next();
                            },
                            require('nunjucks-component-extension-middleware')(require('path').resolve(config.cwd, config.dest))

                        ]
                    },
                    logPrefix: 'SPHINX SERVER'
                },
                port, startpath;

            if ((port = config.port)) {
                opts['port'] = Number(port);
                opts['ui'] = {
                    port: port + 1
                };
            }

            if ((startpath = config.startpath)) {
                opts['startPath'] = startpath;
            }

            bs = require('browser-sync').create();

            // console.dir(bs.instance.utils.getHostIp());

            bs.init(opts, function () {

                if (config.qrcode) {
                    var ewm = require('./src/ewm.js');

                    // 生成二维码
                    ewm(bs);
                }

                gulp.watch(config.cwd, {
                    ignored: [
                        /[\/\\](\.)/,
                        require('path').join(config.cwd, config.dest)
                    ],
                    ignoreInitial: true
                }, gulp.task('release'));
            });

            cb();
        }
    ]));

    return gulp;
}

function formatError(e) {
    if (!e.error) {
        return e.message;
    }

    // PluginError
    if (typeof e.error.showStack === 'boolean') {
        return e.error.toString();
    }

    // Normal error
    if (e.error.stack) {
        return e.error.stack;
    }

    // Unknown (string, number, etc.)
    return new Error(String(e.error)).stack;
}
module.exports = execute;
