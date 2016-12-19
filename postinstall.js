'use strict';

var spawn = require('cross-spawn');
var path = require('path');
var fs = require('fs');
var nodePath = process.execPath;

if (!fs.existsSync(path.join(nodePath, '../../lib/node_modules/sphinx-sln-sc')) && !fs.existsSync(path.join(nodePath, '../sp-sc'))) {
    execNpm('install');
} else {
    execNpm('update');
}

function execNpm(type) {
    try {
        spawn('npm', [type, '-g', 'sphinx-sln-sc'], {
            stdio: 'inherit'
        }).on('error', function (error) {

        }).on('close', function () {

        });
    } catch (e) {

    }
}
