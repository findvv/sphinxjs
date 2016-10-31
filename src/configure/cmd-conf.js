'use strict';
var objectAssign = require('object-assign');
// var cache = {};
var release = {
    describe: '编译发布项目',
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
        solution: {
            alias: 's',
            demand: false,
            type: 'string',
            describe: '指定使用的解决方案'
        },
        conf: {
            type: 'string',
            describe: '指定配置文件的路径',
            inConfFile: false
        },
        cwd: {
            type: 'string',
            describe: '指定要编译项目的路径',
            'default': process.cwd(),
            inConfFile: false
        },
        namespace: {
            type: 'string',
            describe: '指定模块化编译时，全局namespace. 只在启用模块化时有效',
            'default': 'ns'
        }

    },
    override: false
};

var server = {
    describe: '编译发布项目，并启用web server',
    options: {

    },
    override: false
};

server.options = objectAssign({
    livereload: {
        alias: 'L',
        type: 'boolean',
        demand: false,
        describe: '启用livereload，自动刷新浏览器',
        'default': true
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

var cmdConf = {
    release: release,
    server: server
};

module.exports = cmdConf;
