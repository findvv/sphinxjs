// 对 vinyl 扩展 sphinxjs 私有属性
'use strict';
var through = require('through2');



module.exports = function () {
    return through.obj(function (file, enc, cb) {
        var props = {};

        if (file.isNull()) {
            this.push(file);
            return cb();
        }

        if (file.isStream()) {
            this.push(file);
            return cb();
        }

        if (file.isBuffer()) {
            // 定义私有属性 meta，存储原始数据
            Object.defineProperty(props, 'meta', {
                value: {
                    cwd: file.cwd,
                    base: file.base,
                    history: file.history,
                    stat: file.stat,
                    path: file.path
                },
                writable: false,
                configurable: false
            });

            Object.defineProperty(props, 'cache', {
                value: {
                    contnets: new lazystream.Readable(function () {
                        return
                    })
                },
                writable: false,
                configurable: false
            });

            Object.defineProperty(file, 'sphinx', {
                value: props
            });



            this.push(file);
            return cb();
        }
    });
};
