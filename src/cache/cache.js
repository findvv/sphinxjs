'use strict';

var pkg = require('../../package.json');
var os = require('os');
var home = typeof os.homedir == 'function' ? os.homedir() : homedir();
var config = require('../configure/config');
var pth = require('path');
var crypto = require('crypto');
var fs = require('fs');
var _ = require('../util.js');
var mkdirp = require('mkdirp');
var objectAssign = require('object-assign');

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

function getCacheDir(optimize) {
    var homeDir = pth.join(home, '.sphinx-tmp');

    if (optimize) {
        homeDir = pth.join(homeDir, 'optimize');
    } else {
        homeDir = pth.join(homeDir, 'release');
    }
    mkdirp(homeDir);
    return homeDir;
}

function Cache(path, mtime, optimize) {
    var cacheDir = getCacheDir(optimize),
        basename = pth.basename(path),
        hash = md5(path, 10);

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
    this.version = pkg.version;
    //this.cacheFile = pth.join(cacheDir, basename + '-content-' + hash + '.tmp');
    this.cacheInfo = pth.join(cacheDir, basename + '-config-' + hash + '.json');
    this.hasChange = false;
    this.enable = false;
}

Cache.prototype = {
    save: function (contents, onRead) {
        var info;

        if (this.enable) {
            return onRead();
        }

        info = {
            timestamp: this.timestamp,
            deps: this.deps,
            requires: this.requires,
            depsOrder: this.depsOrder,
            version: this.version,
            contents: contents
        };
        this.setConfig(info).then(function () {
            onRead();
        }).catch(function (e) {
            onRead(e);
        });
        // Promise.all([this.setContents(content), this.setConfig(info)]).then(function () {
        //     onRead();
        // }).catch(function (e) {
        //     onRead(e);
        // });
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
                    if (cacheInfo.version == self.version && cacheInfo.timestamp == self.timestamp) {
                        deps = cacheInfo.deps;
                        var allValid = Object.keys(deps).every(function (f) {
                            var mtime = _.mtime(f);

                            return mtime != 0 && deps[f] == mtime.getTime();
                        });

                        if (!allValid) {
                            resolve(false);
                        } else {
                            self.deps = deps;
                            self.contents = cacheInfo.contents;
                            self.requires = cacheInfo.requires;
                            self.enable = true;
                            resolve(true);
                        }
                    } else {
                        resolve(false);
                    }
                }

            });
        });
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
    }
};
module.exports = Cache;