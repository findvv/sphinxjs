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

// var os = require('os');
// var home = typeof os.homedir == 'function' ? os.homedir() : homedir();
// var config = require('./src/configure/config');
// var pth = require('path');
// var crypto = require('crypto');

// var Vinyl = require('vinyl');

// function homedir() {
//     var env = process.env;
//     var home = env.HOME;
//     var user = env.LOGNAME || env.USER || env.LNAME || env.USERNAME;

//     if (process.platform === 'win32') {
//         return env.USERPROFILE || env.HOMEDRIVE + env.HOMEPATH || home || null;
//     }

//     if (process.platform === 'darwin') {
//         return home || (user ? '/Users/' + user : null);
//     }

//     if (process.platform === 'linux') {
//         return home || (process.getuid() === 0 ? '/root' : (user ? '/home/' + user : null));
//     }

//     return home || null;
// }

// function md5(data, len) {
//     var md5sum = crypto.createHash('md5'),
//         encoding = typeof data === 'string' ? 'utf8' : 'binary';

//     md5sum.update(data, encoding);
//     len = len || 7;
//     return md5sum.digest('hex').substring(0, len);
// }

// function cacheDir() {
//     var homeDir = pth.join(home, '.sphinx-tmp');

//     if (config.optimize) {
//         homeDir = pth.join(homeDir, 'optimize');
//     } else {
//         homeDir = pth.join(homeDir, 'release');
//     }
// }

// var t = new Vinyl({
//     cwd: cacheDir(),
//     path: 'gml' + '-content-' + 'gml' + '.tmp'
// });
// t.contents = new Buffer('asdf');
// var fs = require('fs');
// const stripBomStream = require('strip-bom-stream');
// var lazystream = require('lazystream');
// t.contents = new lazystream.Readable(function() {
//     return fs.createReadStream('./changelog.md');
// }).pipe(stripBomStream());
// console.log(t.contents.toString());

// var glob = require('glob');
// var fs = require('fs');
// var prettyTime = require('pretty-hrtime');

// var _ = require('./debug-fis.js');
// var t = process.hrtime();

// glob('/Users/gml/sm/sc/**', function (err, files) {
//     // console.log('glob' + prettyTime(process.hrtime(t)));
//     // console.log(files.length);
//     // var t = process.hrtime();
//     var promises = [];
//     files.forEach(function (k) {

//         promises.push(syncRead(k));
//     });
//     Promise.all(promises).then(function () {
//         console.log('glob' + prettyTime(process.hrtime(t)));

//     });
// });
// var t1 = process.hrtime();
// glob('/Users/gml/sm/sc/**', function (err, files) {

//     var promises = [];
//     files.forEach(function (k) {
//         promises.push(read(k));

//     });

//     Promise.all(promises).then(function () {
//         console.log(prettyTime(process.hrtime(t1)));

//     });
// });
// var promises = [];
// var t2 = Date.now();
// _.find('/Users/gml/sm/sc', null, null, '/Users/gml/sm/sc').forEach(function (file) {

//     promises.push(syncRead(file));
// });
// Promise.all(promises).then(function () {
//     console.log('sync' + (Date.now() - t2));

// });

// var promises1= [];
// var t3 = Date.now();
// _.find('/Users/gml/sm/sc', null, null, '/Users/gml/sm/sc').forEach(function (file) {
//     promises1.push(read(file));

// });
// Promise.all(promises1).then(function () {
//     console.log('async' + (Date.now() - t3));

// });
//
// console.log(_.glob('+(img)/**'));

// var minimatch = require('minimatch');
// var regexp = minimatch.makeRe('(img)/*', {
//       matchBase: true,
//       nocase: true
//     });
// console.log(regexp.source);
// console.log(regexp.test('a/img/loading.png'));

// function syncRead(path) {
//     return new Promise(function (resolve, reject) {
//         if (fs.statSync(path).isFile()) {
//             fs.readFileSync(path);

//         }
//         resolve();
//     })

// };

// function read(path) {

//     return new Promise(function (resolve, reject) {
//         fs.stat(path, function (err, stat) {
//             if (stat.isFile()) {
//                 fs.readFile(path, function (err, data) {
//                     resolve(err);
//                 })
//             } else {
//                 resolve();
//             }
//         })

//     })

// }
//
//
//

// var through = require('through2');

// function create(options) {
//     var stream = through.obj();

//     return stream;
// }

// var stream = create();
// var count = 2;

// var t = setInterval(function () {
//     stream.write({
//         path: 'x' + count
//     });
//     count++;

//     if (count == 10) {
//         stream.end();
//         clearInterval(t);
//     }

// }, 1000);

// stream.pipe(through.obj(function (obj, enc, cb) {
//     console.log(obj);
//     this.push(obj);
//     cb();
// }));

var regExp =/<(script).*?data-main.*?>([\s\S]*?)<\/\1>/mig;
var s = '<script src="./z.js" type="text/javascript" data-main>asdf</script>';
console.log(regExp.test(s));

s.replace(regExp, function () {
    console.dir(arguments);
});





