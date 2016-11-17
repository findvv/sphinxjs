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
  release  编译发布项目                       [aliases: r]
  server   编译发布项目，并启用web server      [aliases: s]

release [options]
  --glob, -g      [array] 使用glob配置要编译的文件
  --dest, -d      [string]  编译输出目录
  --optimize, -o  [boolean] 启用压缩
  --conf          [string]  指定配置文件的路径
  --cwd           [string]  指定要编译项目的路径
  --clean, -c     [boolean] 清除缓存

server [options]
  --live, -L      [boolean] 启用livereload，自动刷新浏览器
  --qrcode        [boolean] 生成URL二维码
  --startpath     [string]  指定打开浏览器时的相对路径
  --port, -p      [number]  web server的端口
  --glob, -g      [array] 使用glob配置要编译的文件
  --dest, -d      [string]  编译输出目录
  --optimize, -o  [boolean] 启用压缩
  --conf          [string]  指定配置文件的路径
  --cwd           [string]  指定要编译项目的路径
  --clean, -c     [boolean] 清除缓存

选项：
  -v, --version  显示版本号
  -c, --clean    清除缓存
  -h, --help     显示帮助文档                                             [布尔]


```
使用sphinx只有两条命令：

+ sphinx release: 编译并发布项目
+ sphinx server: 编译发布项目，并启动内置调试服务器

### 配置文件

sphinx的所有命令行参数都可在sphinx-conf.js中进行配置

```js
module.exports = {
  glob: [
    "+(img)/**"
  ],
  solution: 'sc',
  entry: 'result.html',
  dest: 'output'
}

```

*NOTE:* `solution`和`entry`是SM搜索sc业务基于sphinx封装解决方案的专用参数。

### glob规则

sphinx使用node-glob提供glob的支持，具体规则[node-glob](https://github.com/isaacs/node-glob)或者[node-glob学习笔记](http://www.cnblogs.com/liulangmao/p/4552339.html)，这里简单列下规则：

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

### 模块化

在项目中可以使用COMMONJS规范的模块化，但是要遵循以下约定：

+ 需要使用 'use module' 来做标示，便于sphinx做离线转化。
+ 使用 "require" 请求依赖。
+ 必须使用 “module.exports” 作为模块的输出。
+ 在script标签上加入 data-main 支持模块化代码。
+ 支持别名机制，可以在配置文件中配置。

#### Example

sphinx-conf.js 中配置模块化使用的别名以及依赖

```js
module.exports = {
  alais: {
    zepto: {
      path: '/js/zepto.js',
      exports: 'zepto'
    },
    share: {
      path: '/js/sm.helper.share.js',
      exports: 'sm.helper.share',
      deps: ['/js/sm.helper.ucAPI.v1.js']
    }
  }

}

```

b.js

```js
  'use module';
  var zepto = require('zepto');
  var share = require('share');
  var a = require('./a.js');

  console.log(a.say());

```

a.js

```js
  'use module';
  module.exports = {
    say: function () {
      return 'hello';
    }
  }
```

c.css

```css
  div{
    color: red;
  }
```

index.html

```html

  <!DOCTYPE html>
  <html>
  <head>
    <title></title>
    <script data-main>
      require('./c.css');
    </script>
  </head>
  <body>

    <script data-main>
      require('./b.js');
    </script>
  </body>
  </html>
```
### 资源定位

+ 在html支持script、link、style等带有src或href属性的资源定位。
+ 在js文件中支持使用__uri进行资源定位。
+ 在css文件中识别url进行资源定位。

### 内嵌资源

+ 在html中内嵌资源

  1. 内嵌图片
  ```html
  <!--源码-->
  <img title="SM" src="images/SM.png?__inline"/>

  <!--编译后-->
  <img title="SM" src="data:image/png;base64,asdfasdfsdfadf"/>

  ```
  2. 内嵌样式
  ```html
  <!--源码-->
  <link rel="stylesheet" type="text/css" href="demo.css?__inline">

  <!--编译后-->
  <style>img { border: 5px solid #ccc; }</style>
  ```

  3. 内嵌脚本
  ```html
  <!--源码-->
  <script type="text/javascript" src="demo.js?__inline"></script>

  <!--编译后-->
  <script type="text/javascript">console.log('inline file');</script>
  ```
  4. 内嵌页面
  ```html
  <!--源码-->
  <link rel="import" href="demo.html?__inline">

  <!--编译后-->
  <h1>demo.html content</h1>
  ```
+ 在js中内嵌资源

  在js中可以利用__inline(path)内嵌资源。

+ 在css中内嵌资源

  通过添加 ?__inline 编译标记都可以把文件内容嵌入进来

### TMPL文件

  TMPL文件是sphinx中的模板文件，主要使用Underscore来编译。
