'use strict';
var gulp = require('../../gulp');
var cache = require('../cache/cache.js');

module.exports = {
    release: handler,
    server: handler
};

function handler(task, argv) {
    try {

        if (argv.clean) {
            cache.clean(function () {
                gulpParallel(task);
            });
        } else {
            gulpParallel(task);
        }

    } catch (e) {
        console.log(e);
    };
};

function gulpParallel(task) {
    gulp.parallel(task)(function (err) {
        if (err) {
            console.log(err);
            process.exit(1);
        }
    });
};
