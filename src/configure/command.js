'use strict';
var yargs = require('yargs'),
    objectAssign = require('object-assign'),
    chalk = require('chalk'),
    _ = require('../util.js'),
    handlers = require('./cmd-handler'),
    cmdConf;

function createCommand(command, describe, options, usage, handler, color) {
    var name, opts = objectAssign({}, options);

    if (!_.is(command, 'string') || !_.is(describe, 'string') || !command || !describe) {
        throw new Error('command and describe parameter must be string and must not be empty');
    }
    name = command.split(' ')[0];
    if (!(color in chalk)) {
        color = 'gray';
    }

    color = chalk[color];

    Object.keys(opts || {}).forEach(function (key) {
        if ('default' in opts[key]) {
            delete opts[key]['default'];
        }
    });

    usage = usage || chalk.bold('\nUsage:') + ' $0 ' + name + ' [options]';

    return {
        command: name,
        describe: color(describe),
        builder: function () {
            return yargs
                .options(opts || {})
                .usage(usage)
                .help('h')
                .describe('h', chalk.gray('显示帮助文档'));
        },
        handler: function (argv) {
            if (_.is(handler, 'function')) {
                handler(name, argv);
            }
        }
    };
}

function createCMDS(opts) {
    var cmds = [],
        item;

    Object.keys(opts).forEach(function (key) {
        var handler;

        item = opts[key];

        if (!('override' in item) || item.override) {
            handler = item.handler || handlers[key];
        } else {
            handler = handlers[key];
        }
        cmds.push(createCommand(key, item.describe, item.options, item.usage, handler, item.color));
    });

    return cmds;

}

function createCLI(opts) {
    var _yargs,
        commands;

    opts = opts || {};

    commands = createCMDS(opts);

    if (!_.is(commands, 'array')) {
        throw new Error('commands parameter must be Array');
    }

    _yargs = yargs
        .options({
            v: {
                alias: 'version',
                demand: false,
                describe: chalk.gray('显示版本号')
            },
            c: {
                alias: 'clean',
                describe: chalk.gray('清除缓存')
            }
        })
        .usage(chalk.bold('\nUsage:') + ' $0 ' + chalk.blue('<command>'));

    for (var i = 0, command; command = commands[i]; i++) {
        _yargs = _yargs.command(command);
    }
    Object.keys(opts).forEach(function (key) {
        var options = opts[key].options || {};

        Object.keys(options).forEach(function (key1) {
            var opt = options[key1],
                groupItem = key1;

            if ('alias' in opt) {
                groupItem += ', -' + opt.alias;
            }
            _yargs.group(groupItem, key + ' [options]').describe(groupItem, '[' + opt.type + ']\t' + chalk.gray(opt.describe));
        });
    });

    return _yargs
        .help('h')
        .alias('h', 'help')
        .describe('help', chalk.gray('显示帮助文档'))
        .locale('zh_CN');
}

module.exports = {
    createCmd: createCommand,
    createCLI: createCLI,
    createCMDS: createCMDS,
    defaultCLI: function (handler) {
        if (!cmdConf) {
            cmdConf = require('./cmd-conf.js');
        }
        return this.createCLI(cmdConf, handler);
    }
};
