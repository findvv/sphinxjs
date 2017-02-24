'use strict';

var esprima = require('esprima');
var estraverse = require('estraverse');
var escodegen = require('escodegen');
var esquery = require('esquery');
var Syntax = require('./syntax.js');
var requireDeclare = [':function[id.name = "require"]', 'AssignmentExpression[left.name = "require"][right.callee.type = "FunctionExpression"]', 'AssignmentExpression[left.name = "require"][right.type = "FunctionExpression"]'];
var requireCall = ['CallExpression[callee.name = "require"]'];
var moduleExports = ['MemberExpression[property.name = "exports"][object.name = "module"]'];
var pth = require('path');
var _ = require('./util.js');
var fs = require('fs');
var crypto = require('crypto');
var pathIsAbsolute = require('path-is-absolute');
var DEFAULTNAMESPACE = 'sm';
var src;
var dirname;
var map = {};
var commentsMap = {};

function error(message) {
    throw new Error(message + ' in [' + src + ']');
}
var util = {
    uri: function (url, dirname, cwd) {

        var info = _.uri(url, dirname, cwd);

        // var realpath = pth.resolve(dirname, url),
        //     subpath = pth.relative(cwd, realpath);

        return {
            realpath: info.realpath,
            subpath: pth.relative(cwd, info.realpath)
        };
    },
    md5: function (data, len) {
        var md5sum = crypto.createHash('md5'),
            encoding = typeof data === 'string' ? 'utf8' : 'binary';

        md5sum.update(data, encoding);
        len = len || 7;
        return md5sum.digest('hex').substring(0, len);
    },
    content2AST: function (content) {
        try {
            return esprima.parse(content, {
                loc: true,
                range: true,
                tolerant: true
            });
        } catch (e) {
            error(e.message);
        }
    },

    buildMemberExpression: function (name, ns) {
        // ns = ns || DEFAULTNAMESPACE;

        if (ns) {
            return {
                type: Syntax.MemberExpression,
                computed: false,
                object: {
                    type: Syntax.Identifier,
                    name: ns
                },
                property: {
                    type: Syntax.Identifier,
                    name: name
                }
            };
        } else {
            return {
                type: Syntax.Identifier,
                name: name
            };
        }
    },
    wrap: function (ast, exportName, ns) {
        var wrapper = [],
            wAst;

        ns = ns || DEFAULTNAMESPACE;
        wrapper.push('(function(' + ns + '){');

        if (exportName) {
            wrapper.push(exportName + ' = ' + exportName + ' || {};');
        }

        wrapper.push('})((window.' + ns + ' = window.' + ns + ' || {}));');

        wAst = this.content2AST(wrapper.join(''));

        estraverse.replace(wAst, {
            leave: function (node, parent) {
                var body,
                    item;

                if (node.type === Syntax.BlockStatement && parent.type === Syntax.FunctionExpression && parent.params[0].name === ns) {
                    body = [].slice.call(node.body, 0);
                    item = [].slice.call(ast.body, 0);

                    for (var i = 0, len = item.length; i < len; i++) {
                        body.splice(1 + i, 0, item[i]);
                    }

                    return {
                        type: node.type,
                        body: body
                    };
                }
            }
        });

        return wAst;
    },

    isRequire: function (node) {
        return node.type === Syntax.CallExpression && node.callee.name === 'require';
    },
    isExports: function (node) {
        return node.type == Syntax.MemberExpression && 'name' in node.object && node.object.name === 'module' && 'name' in node.property && node.property.name === 'exports';
    },
    isExistsNode: function (ast, partterns) {
        var isFlag, matches;

        if (!Array.isArray(partterns)) {
            partterns = [partterns];
        }

        for (var i = 0, parttern; parttern = partterns[i]; i++) {
            try {
                matches = esquery.match(ast, esquery.parse(parttern));
                isFlag = matches.length > 0;
            } catch (e) {
                isFlag = false;
            }

            if (isFlag) {
                return true;
            }
        }
        return isFlag;
    },
    requireArgHandle: function (argv, based, isCheckFileExists) {
        var requireArgv, item, _export, info, id, extname;

        if (_.isString(argv)) {
            requireArgv = argv;
        } else {
             // require 没有参数
            if (argv.length == 0) {
                error('exists no parameter require');
            }
            // require 参数不是String
            if (argv[0].type !== Syntax.Literal || typeof argv[0].value !== 'string') {
                error('require function accepts only string parameter');
            }
            requireArgv = argv[0].value;
        }

        extname = pth.extname(requireArgv).replace('.', '');

        if (!(/^(js|css|scss|sass|less)$/.test(extname))) {
            requireArgv += '.js';
        }

        info = this.uri(requireArgv, dirname, based);

        this.checkFileExists(info.realpath, isCheckFileExists);
        if (info.subpath in map || ('/' + info.subpath) in map) {

            item = map[info.subpath] || map['/' + info.subpath];
            if (item) {

                // requireArgv = item.path;

                if ('exports' in item || 'deps' in item) {
                    _export = item.exports;

                    // info = this.uri(requireArgv, dirname, based);

                    return {
                        path: info.subpath,
                        exports: _export || util.buildId(info.realpath),
                        usemap: true,
                        deps: item.deps || []
                    };
                }
            } else {
                error('please checked your alias config');
            }
        }

        // info = this.uri(requireArgv, dirname, based);

        // this.checkFileExists(info.realpath, isCheckFileExists);
        id = util.buildId(info.realpath);
        this.commentsMap(id, info.subpath);
        return {
            path: info.subpath,
            exports: id,
            usemap: false,
            deps: []
        };
    },
    checkFileExists: function (absPath, isCheckFileExists) {
        if (isCheckFileExists && !fs.existsSync(absPath)) {
            error('unable to find file: ' + absPath);
        }
        return absPath;
    },
    buildId: function (path) {
        var basename = pth.basename(path),
            id = basename.replace(/[:\/\\.-]+/g, '_') + this.md5(path, 7);

        return id;
    },
    commentsMap: function (id, path) {
        if (_.isJs(_.extname(src))) {
            commentsMap[id] = path;
        }
    },
    ast2Content: function (ast, isCompress) {
        var escodegenConf = {
                format: {
                    escapeless: true
                }
            },
            content,
            comments;

        if (isCompress) {
            escodegenConf = {
                format: {
                    indent: {
                        style: '',
                        base: 0
                    },
                    compact: true,
                    newLine: '',
                    escapeless: 'true'
                }
            };
        } else {
            comments = _.isEmpty(commentsMap) ? null : JSON.stringify(commentsMap, null, 4);
        }
        try {
            content = escodegen.generate(ast, escodegenConf);
        } catch (e) {
            error(e.message);
        }

        if (comments) {
            content = '/*' + comments + '*/\n' + content;
        }

        return content;
    }

};

function m2cByRegExp(opts) {
    var content = opts.content,
        based = opts.based,
        isCheckFileExists = opts.isCheckFileExists,
        deps = [],
        ns = opts.ns,
        exportName = opts.exportName,
        isWrap = opts.isWrap,
        wrapper = [],
        regExp = /(?:(?:(?:require)\s*?\((['"]{1})([^'"]*)\1\))|(module\.exports))/gmi;

    content = content.replace(regExp, function (all, $1, require, exports) {
        var info, id, usemap;

        if (require) {

            info = util.requireArgHandle(require, based, isCheckFileExists);
            deps = deps.concat(info.deps);
            deps.push(info.path);
            id = info.exports;
            usemap = info.usemap;
        }

        if (exports) {
            id = util.buildId(src);
            exportName = ns + '.' + id;
        }

        if (id) {
            if (usemap) {
                return id;
            }

            return ns + '.' + id;
        }
        return all;
    });

    if (isWrap) {
        wrapper.push('(function(' + ns + '){');
        if (exportName) {
            wrapper.push(exportName + ' = ' + exportName + ' || {};');
        }
        wrapper.push(content);

        wrapper.push('})((window.' + ns + ' = window.' + ns + ' || {}));');
    }
    return {
        content: content,
        deps: deps
    };
}

function m2cByAST(opts) {
    var ast, content = opts.content,
        deps = [],
        based = opts.based,
        isCheckFileExists = opts.isCheckFileExists,
        ns = opts.ns,
        isWrap = opts.isWrap,
        exportName = opts.exportName,
        compress = opts.compress;

    ast = util.content2AST(content);
    // 存在require的声明或者 没有require和module.exports,则跳过该文件
    if (util.isExistsNode(ast, requireDeclare) || (!util.isExistsNode(ast, requireCall) && !util.isExistsNode(ast, moduleExports))) {
        return {
            content: content,
            deps: []
        };
    }

    estraverse.replace(ast, {
        enter: function (node, parent) {
            if (node.type === Syntax.ExpressionStatement && util.isRequire(node.expression)) {
                var info = util.requireArgHandle(node.expression.arguments, based, isCheckFileExists);

                deps = deps.concat(info.deps);
                deps.push(info.path);

                return estraverse.VisitorOption.Remove;
            }
        },
        leave: function (node, parent) {
            var info, id, usemap;

            if (node.type === Syntax.ExpressionStatement && !node.expression) {
                return estraverse.VisitorOption.Remove;
            }

            if (util.isRequire(node)) {
                info = util.requireArgHandle(node.arguments, based, isCheckFileExists);
                deps = deps.concat(info.deps);
                deps.push(info.path);
                id = info.exports;
                usemap = info.usemap;
            }

            if (util.isExports(node)) {
                id = util.buildId(src);
                exportName = ns + '.' + id;
            }

            if (id) {
                if (usemap) {
                    return util.buildMemberExpression(id);
                }

                return util.buildMemberExpression(id, ns || DEFAULTNAMESPACE);
            }
        }
    });

    if (isWrap) {
        ast = util.wrap(ast, exportName, ns);
    }
    return {
        content: util.ast2Content(ast, compress),
        deps: deps.map(function (v) {
            return v.toString().replace(/^\//, '');
        })
    };
}

function getOpts(opts) {
    var result = {};

    opts = opts || {};
    if (!pathIsAbsolute(opts.src)) {
        error('src must be absolute path');
    }
    if (!opts.content) {
        error('content is required');
    }
    src = opts.src;
    commentsMap = {};

    result = {
        src: src,
        map: opts.map || {},
        dirname: pth.dirname(src),
        compress: opts.compress,
        based: opts.based || process.cwd(),
        content: opts.content,
        ns: opts.ns || DEFAULTNAMESPACE,
        isWrap: opts.isWrap,
        isCheckFileExists: opts.isCheckFileExists,
        isAST: opts.isAST
    };

    return result;

}

module.exports = function (opts) {
    // var content, based, isCheckFileExists,
    //     ast, deps = [],
    //     ns, exportName,
    //     isWrap, compress;

    // opts = opts || {};
    // if (!pathIsAbsolute(opts.src)) {
    //     error('src must be absolute path');
    // }
    // if (!opts.content) {
    //     error('content is required');
    // }
    // src = opts.src;
    // map = opts.map || {};
    // commentsMap = {};
    // dirname = pth.dirname(src);
    // compress = opts.compress;
    // based = opts.based || process.cwd();
    // content = opts.content;
    // ns = opts.ns || DEFAULTNAMESPACE;

    // isWrap = opts.isWrap;

    // isCheckFileExists = opts.isCheckFileExists;
    opts = getOpts(opts);
    src = opts.src;
    dirname = opts.dirname;
    map = opts.map;
    commentsMap = {};

    if (!opts.isRegExp) {

        return m2cByAST(opts);
    } else {
        return m2cByRegExp(opts);
    }
};
