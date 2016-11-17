
// var glob = require('glob');
// var fs = require('fs');
// var prettyTime = require('pretty-hrtime');

// var _ = require('./debug-fis.js');
// var t = process.hrtime();

// glob('**', {
//     cwd: '/Users/gml/sm/sc/'
// }, function (err, files) {
//     console.log('glob' + prettyTime(process.hrtime(t)));
//     console.log('glob.result' + files.length);
// });

//  var t1 = process.hrtime();

// console.log('glob.sync.result' + glob.sync('**', {
//     cwd: '/Users/gml/sm/sc/'
// }).length);
// console.log('glob.sync' + prettyTime(process.hrtime(t1)));

// var t2 = process.hrtime();

// console.log('sync.result' + _.find('/Users/gml/sm/sc', ['**'], null, '/Users/gml/sm/sc').length);
// console.log('sync' + prettyTime(process.hrtime(t2)));

// function syncRead(path) {
//     return new Promise(function (resolve, reject) {
//         if (fs.statSync(path).isFile()) {
//             fs.readFileSync(path);

//         }
//         resolve();
//     });

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
