sphinx 构建工具
---

[![Build Status](https://travis-ci.org/smocean/sphinxjs.svg?branch=dev)](https://travis-ci.org/smocean/sphinxjs)  [![Coverage Status](https://coveralls.io/repos/github/smocean/sphinxjs/badge.svg?branch=dev)](https://coveralls.io/github/smocean/sphinxjs?branch=dev)    [![npm](https://img.shields.io/npm/dt/sphinx.svg?maxAge=2592000)](https://www.npmjs.com/package/sphinxjs)   [![npm](https://img.shields.io/npm/v/sphinxjs.svg?maxAge=2592000)](https://www.npmjs.com/package/sphinxjs)  [![npm](https://img.shields.io/npm/dm/sphinxjs.svg?maxAge=2592000)](https://www.npmjs.com/package/sphinxjs)     [![npm](https://img.shields.io/npm/l/sphinxjs.svg?maxAge=2592000)](https://www.npmjs.com/package/sphinxjs)

sphinx 神马搜索前端构建工具。

## 安装
```
    npm install -g sphinxjs
```

## 命令行

执行sphinx -h 查看命令的相关帮助：

```
Usage: sphinx <command>

命令：
  release  编译发布项目
  server   编译发布项目，并启用web server

release [options]
  --glob, -g      [array]   使用glob配置要编译的文件
  --dest, -d      [string]  编译输出目录
  --optimize, -o  [boolean] 启用压缩
  --conf          [string]  指定配置文件的路径
  --cwd           [string]  指定要编译项目的路径
  --namespace     [string]  指定模块化编译时，全局namespace. 只在启用模块化时有效

server [options]
  --live, -L  [boolean]   启用livereload，自动刷新浏览器
  --qrcode          [boolean]   生成URL二维码
  --startpath       [string]    指定打开浏览器时的相对路径
  --port, -p        [number]    web server的端口
  --glob, -g        [array] 使用glob配置要编译的文件
  --dest, -d        [string]    编译输出目录
  --optimize, -o    [boolean]   启用压缩
  --conf            [string]    指定配置文件的路径
  --cwd             [string]    指定要编译项目的路径
  --namespace       [string]    指定模块化编译时，全局namespace.
                    只在启用模块化时有效

选项：
  -v, --version  显示版本号
  -h, --help     显示帮助                                                 [布尔]

```
使用sphinx只有两条命令：

+ sphinx release: 编译并发布项目
+ sphinx server: 编译发布项目，并启动内置调试服务器

### glob规则

sphinx使用node-glob提供glob的支持，具体规则[node-glob](https://github.com/isaacs/node-glob)，这里简单列下规则：

    - `*`  匹配0或多个除了 `/` 以外的字符
    - `?`  匹配单个除了 `/` 以外的字符
    - `**` 跨路径匹配任意字符
    - `[]` 若字符在中括号中，则匹配。若以 ! 或 ^ 开头，若字符不在中括号中，则匹配
    - `!(pattern|pattern|pattern)` 不满足括号中的所有模式则匹配
    - `?(pattern|pattern|pattern)` 满足 0 或 1 括号中的模式则匹配
    - `+(pattern|pattern|pattern)` 满足 1 或 更多括号中的模式则匹配
    - `*(pattern|pattern|pattern)` 满足 0 或 更多括号中的模式则匹配
    - `@(pattern|pattern|pattern)` 完全匹配模式中的一个
```
sphinx release --glob '+(img|css|js)/**'

```



