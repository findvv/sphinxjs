'use strict';

var config = require('./src/configure/config.js');
var Liftoff = require('liftoff');

var showLogo = require('./logo.js');
var argv = require('yargs-parser')(process.argv.slice(2));
var objectAssign = require('object-assign-deep');
var command = require('./src/configure/command.js');
var plugin = require('./src/plugin.js');
var Cache = require('./src/cache/cache.js');

var liftoff = new Liftoff({
    name: 'sphinx',
    configName: 'sphinx-conf',
    extensions: {
        '.js': null,
        '.json': null
    }
});

var sphinx = {
    config: config,
    Base: require('./src/task/base.js'),
    util: require('./src/util.js'),
    ext: require('./src/ext.js'),
    lang: require('./src/lang.js'),
    inline: require('./src/inline.js')
};

if (!global.sphinx) {
    Object.defineProperty(global, 'sphinx', {
        enumerable: true,
        writable: false,
        configurable: false,
        value: sphinx
    });
}

// 输出版本和logo
if (argv.version || argv.v) {
    showLogo();
}

if ((argv.clean || argv.c) && argv._.length == 0) {

    Cache.clean();
    process.exit(0);
}

liftoff.launch({
    cwd: argv.cwd,
    configPath: argv.conf
}, invoke);

function invoke(env) {
    var solution,
        cmdConf = require('./src/configure/cmd-conf.js'),
        slnCmdConf,
        sln = require('./src/task/base.js'),
        cli;

    // 加载配置文件

    config.load(env.configPath, false);
    solution = argv.s || argv.solution || config.solution;
    if (solution) {
        slnCmdConf = plugin.getSlnCmd(solution) || {};
        config.mergeCmdConf(slnCmdConf);
        cmdConf = objectAssign(cmdConf, slnCmdConf);
        sln = plugin.getSlnTask(solution) || sln;
    }
    require('./index')(env, sln);
    cli = command.createCLI(cmdConf);
    config.mergeCliArgs(cli.argv);
    if (cli.argv._.length == 0) {
        cli.showHelp();
    }
}
