/**
 * Authors:
 *     明礼 <guomilo@gmail.com>
 */
'use strict';

var fs = require('fs');
var pth = require('path');
var _ = require('./util');
var config = require('./configure/config.js');

function isAllGlob(glob) {
    return /^\*\*$/.test(glob) || /^\*\*\/\*\*$/.test(glob);
}

function globFilter(dest) {
    var globs = config.glob,
        nGlobs = [],
        isNeedForeachDir = false,
        destDir,
        destGlob;

    if (dest) {
        destDir = dest.split('/')[0];
        destGlob = '!(' + destDir + ')/**';
    }

    if (!_.isArray(globs)) {
        globs = [globs];
    }

    for (var i = 0, len = globs.length, gi; gi = globs[i], i < len; i++) {
        if (!isAllGlob(gi)) {
            nGlobs.push(gi);
        } else {
            isNeedForeachDir = true;
        }
    };

    if (isNeedForeachDir) {
        var files = fs.readdirSync(config.cwd);

        files.forEach(function (name) {
            if (destDir == name) {
                return;
            }

            if (_.isDir(pth.resolve(config.cwd, name))) {
                nGlobs.push(`+(${name})/**`);
            }
        });

        nGlobs.push('*.**');
    }
    if (destGlob) {
        nGlobs.push(destGlob);
    }

    return nGlobs;
}

function globHandler() {
    var dest = config.dest || 'output',
        cwd = config.cwd,
        regExp;

    dest = pth.resolve(cwd, dest);

    regExp = new RegExp('^' + cwd.replace(/[\/]$/, '') + '/', 'ig');

    if (regExp.test(dest)) {
        dest = pth.relative(cwd, dest);
    } else {
        dest = null;
    }
    config.glob = globFilter(dest);
    config.dest = config.dest || 'output';
}

module.exports = globHandler;
