// var stream = require('stream');
// var util = require('util');

// // node v0.10+ use native Transform, else polyfill
// var Transform = stream.Transform ||
//     require('readable-stream').Transform;

// function Upper(options) {
//     // allow use without new
//     if (!(this instanceof Upper)) {
//         return new Upper(options);
//     }
//     this.data = [];
//     // init Transform
//     Transform.call(this, options);
// }
// util.inherits(Upper, Transform);

// Upper.prototype._transform = function (chunk, enc, cb) {
//     var upperChunk = chunk.toString();

//     if (upperChunk % 2 == 0) {
//         //this.push(upperChunk);
//         this.data.push(upperChunk);
//     }
//     cb();
// };
// Upper.prototype._flush = function (chunk, enc, cb) {
//     this.push(JSON.stringify(this.data));
//     cb();
// };

// var upper = new Upper();

// upper.pipe(process.stdout);

// var count = 0;
// var t = setInterval(function () {
//     count += 1;
//     upper.write(count.toString());
//     if (count == 10) {
//         upper.end();
//         clearInterval(t);
//     }
// }, 500);
//

var os = require('os');
var home = typeof os.homedir == 'function' ? os.homedir() : homedir();
var config = require('./src/configure/config');
var pth = require('path');
var crypto = require('crypto');

var Vinyl = require('vinyl');

function homedir() {
    var env = process.env;
    var home = env.HOME;
    var user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

    if (process.platform === 'win32') {
        return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null;
    }

    if (process.platform === 'darwin') {
        return home || (user ? '/Users/' + user : null);
    }

    if (process.platform === 'linux') {
        return home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null));
    }

    return home || null;
}

function md5(data, len) {
    var md5sum = crypto.createHash('md5'),
        encoding = typeof data === 'string' ? 'utf8' : 'binary';

    md5sum.update(data, encoding);
    len = len || 7;
    return md5sum.digest('hex').substring(0, len);
}

function cacheDir() {
    var homeDir = pth.join(home, '.sphinx-tmp');

    if (config.optimize) {
        homeDir = pth.join(homeDir, 'optimize');
    } else {
        homeDir = pth.join(homeDir, 'release');
    }
}

var t = new Vinyl({
    cwd: cacheDir(),
    path: 'gml' + '-content-' + 'gml' + '.tmp'
});
t.contents = new Buffer('asdf');
var fs = require('fs');
const stripBomStream = require('strip-bom-stream');
var lazystream = require('lazystream');
t.contents = new lazystream.Readable(function() {
    return fs.createReadStream('./changelog.md');
}).pipe(stripBomStream());
console.log(t.contents.toString());





