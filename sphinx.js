'use strict';
var logo = require('./logo.js');
var config = require('./src/configure/config.js');
let initGulp = require('./index.js');
let gulp = require('./gulp.js');
let cli = require('./src/configure/command.js');
var Cache = require('./src/cache/cache.js');
var Solution = require('./src/task/base.js');
var plugin = require('./src/plugin.js');
var glob = require('./src/glob.js');
var sphinx = {
    config: config,
    Base: require('./src/task/base.js'),
    util: require('./src/util.js'),
    ext: require('./src/ext.js'),
    lang: require('./src/lang.js'),
    inline: require('./src/inline.js')
};
var sln;

if (!global.sphinx) {
    Object.defineProperty(global, 'sphinx', {
        enumerable: true,
        writable: false,
        configurable: false,
        value: sphinx
    });
}

config.init(cli);

sln = config.solution;

if (sln) {
    Solution = plugin.getSlnTask(sln) || Solution;
}

glob();

cli.registerHandler({
    release: invoke,
    server: invoke
});
try {
    cli.create();
} catch (e) {

}

// 输出版本和logo
if (config.version) {
    var pkg = require('./package.json');

    logo(pkg.version);
}

if (config.clean && config._.length == 0) {
    Cache.clean();
    process.exit(0);
}

if (config._.length == 0) {
    cli.yargs.showHelp();
    process.exit(0);
} else if (cli.getCommandNames().indexOf(config._[0]) < 0) {
    // TODO
}

if (config._.length == 0) {
    cli.yargs.showHelp();
    process.exit(0);
}

function invoke(name) {
    initGulp(Solution);
    gulp.series(name)();
}
