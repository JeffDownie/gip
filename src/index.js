var program = require('commander-plus');

program
    .command('commit')
    .action(() => {
        require('./cmds/commit');
    });

program
    .command('init')
    .action(() => {
        require('./cmds/init');
    });

program
    .command('checkout', '<hash>')
    .action((hash) => {
        require('./cmds/checkout')(hash);
    });

program
    .command('clone', '<name> <hash>')
    .action((name, hash) => {
        require('./cmds/clone')(name, hash);
    });

program
    .parse(process.argv);
