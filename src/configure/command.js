'use strict';
var yargs = require('yargs'),
    yargsParser = require('yargs-parser'),
    chalk = require('chalk'),
    _ = require('../util.js');

let release = {
    describe: '编译发布项目',
    aliases: ['run', 'r'],
    options: {
        glob: {
            alias: 'g',
            type: 'array',
            describe: '使用glob配置要编译的文件',
            'default': '**'
        },
        dest: {
            alias: 'd',
            demand: false,
            type: 'string',
            describe: '编译输出目录',
            'default': 'output'
        },
        optimize: {
            alias: 'o',
            demand: false,
            type: 'boolean',
            describe: '启用压缩'
        },
        conf: {
            type: 'string',
            describe: '指定配置文件的路径',
        },
        solution: {
            alias: 's',
            type: 'string',
            describe: '指定使用的解决方案'
        },
        cwd: {
            type: 'string',
            describe: '指定要编译项目的路径',
            'default': process.cwd()
        },
        clean: {
            type: 'boolean',
            describe: '清除缓存',
            alias: 'c'
        },
        domains: {
            type: 'boolean',
            describe: '为资源添加域名'
        },
        md5: {
            type: 'boolean',
            describe: '文件自动加md5戳'
        }

    },
    handler: function () {

    }
};

let server = {
    describe: '编译发布项目，并启用web server',
    aliases: ['s'],
    options: {

    },
    override: false

};

server.options = Object.assign({
    live: {
        alias: 'L',
        type: 'boolean',
        demand: false,
        describe: '启用livereload，自动刷新浏览器'
    },
    qrcode: {
        type: 'boolean',
        describe: '生成URL二维码'
    },
    startpath: {
        demand: false,
        type: 'string',
        describe: '指定打开浏览器时的相对路径'
    },
    port: {
        alias: 'p',
        type: 'number',
        describe: 'web server的端口'
    }
}, release.options);

function createCommand(conf) {
    let opts, usage;

    if (!_.isPlainObject(conf)) {
        throw new Error('parameter isn\'t plain object');
    }
    if (!('name' in conf) || !('describe' in conf)) {
        throw new Error('\'name \' or \' describe \'is required');
    }

    opts = conf.options || {};
    usage = conf.usage || `${chalk.bold('\nUsage:')} $0 ${conf.name} [options]`;

    return {
        command: conf.name,
        aliases: conf.aliases,
        describe: chalk.gray(conf.describe),
        builder: function () {
            return yargs
                .options(opts)
                .usage(usage)
                .help('h')
                .describe('h', chalk.gray('显示帮助'))
                .argv;

        },
        handler: function (argv) {
            if (_.isFunction(conf.handler)) {
                conf.handler(conf.name, argv);
            }
        }
    };
}

function createCommands(conf) {
    var cmds = [],
        item;

    conf = conf || {};

    Object.keys(conf).forEach(function (k) {
        item = conf[k];
        if (!('name' in item)) {
            item.name = k;
        }

        if (!('describe' in item)) {
            item.describe = k;
        }
        cmds.push(createCommand(conf[k]));
    });
    return cmds;
}

function createCLI(conf) {
    var _yargs,
        commands,
        usage = chalk.bold('\nUsage:') + ' $0 ';

    conf = conf || {};

    commands = createCommands(conf);

    if (_.isArray(commands) && commands.length) {
        usage += chalk.blue('<command>');
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
        .usage(usage);

    for (var i = 0, command; command = commands[i]; i++) {
        _yargs = _yargs.command(command);
    }

    Object.keys(conf).forEach(function (key) {
        var options = conf[key].options || {};

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

let conf = {
    release: release,
    server: server
};

class CLI {
    constructor(opts) {
        this.conf = opts || conf;
        this.cliArgs = process.argv.slice(2);
        this.paramsConf = this.getParamsConf();
    }

    registerCommandHandler(command, handler) {
        if (command in this.conf && _.isFunction(handler)) {
            this.conf[command].handler = handler;
        }
    }

    getCommandNames() {
        return Object.keys(this.conf);
    }

    registerHandler(opts) {
        opts = opts || {};
        Object.keys(opts).forEach((k) => {
            this.registerCommandHandler(k, opts[k]);
        });
    }

    create() {
        this.yargs = createCLI(this.conf);

        return this.yargs.argv;
    }

    getArgs() {
        return yargsParser(this.cliArgs, this.paramsConf);
    }

    getAllArgs() {
        var options = ['--version', '-v', '--clean', '-c', '--help', '-h'],
            conf = this.conf,
            item;

        Object.keys(conf).forEach(function (key) {

            Object.keys(conf[key].options).forEach(function (k) {
                item = conf[key].options[k];
                if ('alias' in item) {
                    options.push('-' + item.alias);
                }
                options.push('--' + k);
            });
        });
        return yargsParser(options, this.paramsConf);
    }

    getParamsConf() {
        var alias = {},
            defaults = {},
            item,
            conf = this.conf,
            result = {};

        Object.keys(conf).forEach(function (key) {

            Object.keys(conf[key].options).forEach(function (k) {
                item = conf[key].options[k];

                if ('alias' in item) {
                    alias[k] = [item.alias];
                }
                if ('default' in item) {
                    defaults[k] = item.default;
                }

                result[item.type] = result[item.type] || [];

                result[item.type].push(k);

            });
        });

        alias['version'] = ['v'];
        alias['help'] = ['h'];

        result['alias'] = alias;
        result['default'] = defaults;

        return result;
    }

    getExistsCLIArgs() {

        return yargsParser(this.cliArgs, {
            alias: this.paramsConf.alias
        });
    }

    getDefaultCLIArgs() {

        return yargsParser(this.cliArgs, {
            'default': this.paramsConf.default
        });
    }

    getCommandOptions() {
        let initConf = {},
            conf = this.conf;

        Object.keys(conf).forEach(function (key) {
            initConf = Object.assign(initConf, conf[key].options);
        });

        return initConf;
    }
}

CLI.create = createCLI;
CLI.createCommand = createCommand;
CLI.createCommands = createCommands;

module.exports = new CLI();
