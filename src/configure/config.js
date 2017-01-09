'use strict';
let _ = require('../util.js');
let model = {};
let log = require('gulp-util').log;
let fs = require('fs');
let configure = {};
let pth = require('path');
var mkdirp = require('mkdirp');

// 用于存储使用过程中可能修改的某些参数
let cache = {};
let CLI;
let yargsArgv;
let cliArgv;
let cliDefaultArgv;
let lastLoadTime = 0;

var config = {
    load(path) {
        var conf,
            lastTime,
            mtime,
            fileCache;

        if (path) {
            mtime = _.mtime(path);
            lastTime = mtime != 0 ? mtime.getTime() : mtime;
            if (lastLoadTime >= lastTime) {
                return false;
            }
            try {
                var fileCacheObj = configFileCache();

                fileCache = fileCacheObj.getContents();
                conf = require(path);
                delete require.cache[path];
                model = conf || {};
                if (fileCache.mtime != lastTime) {
                    if (fileCache && fileCache.content && Number(fileCache.content.notEmbedSymbol) != Number(model.notEmbedSymbol)) {
                        require('../cache/cache.js').clean();
                    }
                    fileCacheObj.setContents(model, lastTime);
                }
                defineProperties(model);
                cache = {};
                lastLoadTime = lastTime;
                configure = conf;
                return true;
            } catch (e) {

                log('Loading or Parsing the configuration file "' + path + '" is incorrect: ' + e.message);
                return false;
            }
        } else {
            log('missing config file [sphinx-conf.js] or [sphinx-conf.json]');
            return false;
        }
    },
    init(cli) {
        var path;

        CLI = cli;
        cliArgv = cli.getExistsCLIArgs();
        cliDefaultArgv = cli.getDefaultCLIArgs();

        defineProperties(cli.getAllArgs());

        if (cliArgv.conf) {
            path = cliArgv.conf;
        } else if (cliArgv.cwd) {
            path = pth.resolve(cliArgv.cwd, 'sphinx-conf.js');
        } else {
            path = pth.resolve(process.cwd(), 'sphinx-conf.js');
        }
        this.load(path);

    },
    mergeCLI(cli) {

    }

};

function defineProperties(data) {
    Object.keys(data).forEach(function (key) {
        if (key in config) {
            return;
        }
        defineProperty(key);
    });
}

function defineProperty(key) {
    Object.defineProperty(config, key, {
        configurable: false,
        enumerable: false,
        get: function () {
            var value;

            if (key in cache) {
                value = cache[key];
                return value;
            }

            if (key in cliArgv) {
                yargsArgv = yargsArgv || CLI.getArgs();

                value = yargsArgv[key];
            } else {
                value = model[key];

                if (_.isUndefined(value) && key in cliDefaultArgv) {
                    value = cliDefaultArgv[key];
                };
            }
            return value;

        },
        set: function (value) {
            cache[key] = value;
        }
    });
}

function configFileCache() {
    var cacheDir = pth.join(_.getCacheDir(), config.cwd.replace(/[\\\/]/ig, '_'));
    var cachePath = pth.join(cacheDir, 'sphinx-conf.json');
    var content;

    mkdirp(cacheDir);
    return {
        getContents: function () {
            var result = {};

            if (_.exists(cachePath)) {
                content = fs.readFileSync(cachePath);
                try {
                    return JSON.parse(content);
                } catch (e) {
                    return result;
                }
            } else {
                return {};
            }
        },
        setContents: function (content, mtime) {
            mkdirp.sync(cacheDir);

            fs.writeFileSync(cachePath, JSON.stringify({
                mtime: mtime,
                content: content
            }));
        }
    };

}
module.exports = config;
