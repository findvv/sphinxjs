'use strict';

var pkg = require('../../package.json');
var config = require('../configure/config');
var pth = require('path');
var fs = require('fs');
var _ = require('../util.js');
var mkdirp = require('mkdirp');
var objectAssign = require('object-assign');
var rimraf = require('rimraf');

function getCacheDir() {
    var cacheDir = pth.join(_.getCacheDir(), _.last(config.cwd.split(pth.sep)));

    mkdirp(cacheDir);

    return {
        release: pth.join(cacheDir, 'release'),
        optimize: pth.join(cacheDir, 'optimize')
    };
}

function Cache(path, mtime) {
    var cacheDir = getCacheDir(),
        basename = pth.basename(path),
        hash = _.md5(path, 10);

    if (!mtime) {
        mtime = _.mtime(path);
        if (mtime != 0) {
            mtime = mtime.getTime();
        }
    }
    this.timestamp = mtime;
    this.deps = {};
    this.depsOrder = {};
    this.requires = [];
    this.arequires = [];
    this.version = pkg.version;
    Object.defineProperty(this, 'cacheInfo', {

        configurable: false,
        get: function () {
            var dir, path;

            if (this.optimize) {
                dir = cacheDir['optimize'];
            } else {
                dir = cacheDir['release'];
            }
            mkdirp(dir);

            path = pth.join(dir, basename + '-config-' + hash + '.json');
            return path;
        }
    });
    Object.defineProperty(this, 'cacheFile', {

        configurable: false,
        get: function () {
            var dir, path;

            if (this.optimize) {
                dir = cacheDir['optimize'];
            } else {
                dir = cacheDir['release'];
            }
            mkdirp(dir);

            path = pth.join(dir, basename + '-content-' + hash + '.tmp');
            return path;
        }
    });
    this.hasChange = false;
    this.enable = false;
}

Cache.prototype = {
    setCacheType: function (optimize) {
        this.optimize = !!optimize;
    },
    _getInfo: function (contents) {
        var info = {
            timestamp: this.timestamp,
            deps: this.deps,
            requires: this.requires,
            depsOrder: this.depsOrder,
            arequires: this.arequires,
            version: this.version
            //contents: contents
        };

        return info;
    },
    save: function (contents, onWrite) {
        var info;

        if (this.enable) {
            return onWrite();
        }

        info = this._getInfo(contents);

        mkdirp(pth.dirname(this.cacheInfo));
        // this.setConfig(info).then(function () {
        //     onWrite();
        // }).catch(function (e) {
        //     onWrite(e);
        // });
        Promise.all([this.setContents(contents), this.setConfig(info)]).then(function () {
            onWrite();
        }).catch(function (e) {
            onWrite(e);
        });
    },
    saveSync: function (contents) {
        var info;

        if (this.enable) {
            return;
        }

        info = this._getInfo(contents);
        mkdirp(pth.dirname(this.cacheInfo));
        fs.writeFileSync(this.cacheInfo, JSON.stringify(info));
    },
    _read: function (path, onRead) {
        fs.exists(path, function (err) {
            if (err) {
                fs.readFile(path, function (err, data) {
                    if (err) {
                        return onRead(err);
                    } else {
                        return onRead(null, data);
                    }
                });
            } else {
                return onRead(new Error('not exists ' + path));
            }
        });
    },
    _write: function (path, data, cb) {
        return new Promise(function (resolve, reject) {
            fs.writeFile(path, data, function (err) {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    },
    getConfig: function (onRead) {
        var self = this;

        if (this.config) {
            return onRead(null, this.config);
        } else {
            this._read(this.cacheInfo, function (err, data) {
                if (err) {
                    return onRead(err);
                } else {
                    self.config = JSON.parse(data.toString());
                    onRead(err, self.config);
                }

            });
        }
    },
    setConfig: function (config) {
        return this._write(this.cacheInfo, JSON.stringify(config));
    },
    setContents: function (contents) {
        return this._write(this.cacheFile, contents);
    },
    getContents: function (onRead) {
        var self = this;

        if (this.contents) {
            return onRead(null, this.contents);
        }

        this._read(this.cacheFile, function (err, data) {
            self.contents = data;
            onRead(err, data);
        });
    },
    check: function () {
        var deps, self = this;

        return new Promise(function (resolve, reject) {
            self.getConfig(function (err, cacheInfo) {
                if (err) {
                    resolve(false);
                } else {
                    resolve(self._revert(cacheInfo));
                }

            });
        });
    },
    _revert: function (cacheInfo) {
        var deps, self = this;

        if (cacheInfo.version == self.version && cacheInfo.timestamp == self.timestamp) {
            deps = cacheInfo.deps;
            var allValid = Object.keys(deps).every(function (f) {
                var mtime = _.mtime(f);

                return mtime != 0 && deps[f] == mtime.getTime();
            });

            if (!allValid) {
                return false;

            } else {
                self.deps = deps;
                self.requires = cacheInfo.requires;
                self.arequires = cacheInfo.arequires;
               // self.contents = cacheInfo.contents;
                self.enable = true;
                return true;
            }
        } else {
            return false;
        }

    },
    checkSync: function () {
        var cacheInfo;

        if (_.exists(this.cacheInfo)) {
            cacheInfo = fs.readFileSync(this.cacheInfo);
            this.config = JSON.parse(cacheInfo.toString());
            return this._revert(cacheInfo);
        } else {
            return false;
        }
    },
    addDeps: function (path) {
        var mtime, self = this;

        if (Array.isArray(path)) {
            path.forEach(function (v) {
                self.addDeps(v);
            });
        } else if (typeof path == 'object') {

            this.deps = objectAssign(this.deps, path);

        } else {
            path = path.replace(/['"]/g, '');
            if (path) {
                path = pth.resolve(config.cwd, path);
                mtime = _.mtime(path);
                if (mtime == 0) {
                    this.deps[path] = mtime;
                } else {
                    this.deps[path] = mtime.getTime();
                }
                this.hasChange = true;

            }

            return this;
        }
    },

    addModuleDeps: function (deps) {
        this.requires = deps || [];
    },
    removeDeps: function (path) {
        path = path.replace(/['"]/g, '');
        if (path) {
            path = pth.resolve(config.cwd, path);
            if (this.deps[path]) {
                this.hasChange = true;
                delete this.deps[path];
            }
        }

        return this;
    },
    mergeDeps: function (cache) {
        var deps = {};

        if (cache instanceof Cache) {
            deps = cache.deps;
        } else if (typeof cache === 'object') {
            deps = cache;
        } else {
            throw new Error('unable to merge deps of data [' + cache + ']');
        }

        this.deps = objectAssign(this.deps, deps);

    }
};
Cache.clean = function (func) {
    var dir = getCacheDir();

    if (typeof func !== 'function') {
        rimraf.sync(dir.release);
        rimraf.sync(dir.optimize);
    } else {
        rimraf(dir.release, function () {
            rimraf(dir.optimize, function () {
                _.isFunction(func) && func();
            });
        });

    }

};

module.exports = Cache;
