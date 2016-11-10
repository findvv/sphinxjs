'use strict';
const chalk = require('chalk');
const _ = require('./src/util.js');

module.exports = function (version) {
    let lines = [],
        B = _.isOSX() ? '▒' : '/';

    lines.push(chalk.red(`  ${B}${B}${B}${B}  `) + chalk.yellow(`${B}${B}${B}${B}   `) + chalk.red(`${B}   ${B}   `) + chalk.green(`${B}${B}${B}  `) + chalk.cyan(`${B}   ${B}`));
    lines.push(chalk.red(` ${B}      `) + chalk.yellow(`${B}   ${B}  `) + chalk.red(`${B}   ${B}   `) + chalk.green(` ${B}   `) + chalk.cyan(`${B}   ${B}`));
    lines.push(chalk.red(` ${B}      `) + chalk.yellow(`${B}   ${B}  `) + chalk.red(`${B}   ${B}   `) + chalk.green(` ${B}   `) + chalk.cyan(` ${B} ${B} `));
    lines.push(chalk.red(`  ${B}${B}${B}   `) + chalk.yellow(`${B}${B}${B}${B}   `) + chalk.red(`${B}${B}${B}${B}${B}   `) + chalk.green(` ${B}   `) + chalk.cyan(`  ${B}  `));
    lines.push(chalk.red(`     ${B}  `) + chalk.yellow(`${B}      `) + chalk.red(`${B}   ${B}   `) + chalk.green(` ${B}   `) + chalk.cyan(` ${B} ${B} `));
    lines.push(chalk.red(`     ${B}  `) + chalk.yellow(`${B}      `) + chalk.red(`${B}   ${B}   `) + chalk.green(` ${B}   `) + chalk.cyan(`${B}   ${B}`));
    lines.push(chalk.red(` ${B}${B}${B}${B}   `) + chalk.yellow(`${B}      `) + chalk.red(`${B}   ${B}   `) + chalk.green(`${B}${B}${B}  `) + chalk.cyan(`${B}   ${B}`));
    console.log('\n');
    version && console.log(`v${version}\n`);
    console.log(lines.join('\n'));
    console.log('\n');
    process.exit(0);
};


// ▒▒▒▒   ▒▒▒▒   ▒   ▒  ▒▒▒  ▒   ▒  ▒   ▒
// ▒      ▒   ▒  ▒   ▒   ▒   ▒   ▒  ▒   ▒
// ▒      ▒   ▒  ▒   ▒   ▒   ▒▒  ▒   ▒ ▒
//  ▒▒▒   ▒▒▒▒   ▒▒▒▒▒   ▒   ▒ ▒ ▒    ▒
//     ▒  ▒      ▒   ▒   ▒   ▒  ▒▒   ▒ ▒
//     ▒  ▒      ▒   ▒   ▒   ▒   ▒  ▒   ▒
// ▒▒▒▒   ▒      ▒   ▒  ▒▒▒  ▒   ▒  ▒   ▒
