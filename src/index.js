const ipfsApi = require('ipfs-api');
const camda = require('camda');
const through = require('through2');
const program = require('commander-plus');
const fs = require('fs');
const DAG = require('ipld-dag-pb');
const path = require('path');

const CB = camda.CB;
const ipfs = ipfsApi();
const DAGLink = DAG.DAGLink;
const DAGNode = DAG.DAGNode;

const getIPFSObject = CB.CBify(ipfs.object.get);
const readFile = CB.CBify(fs.readFile);
const statFile = CB.CBify(fs.stat);

program
    .command('commit')
    .action(commit);

program
    .command('init')
    .action(init);

program
    .command('checkout', '<hash>')
    .action(checkout);

program
    .command('clone', '<name> <hash>')
    .action(clone);

program
    .parse(process.argv);

const findGipDir = CB.CBify((originalDir, cb) => {
    const dir = path.normalize(path.resolve(originalDir) + '/');
    fs.stat(dir + '.gip', (err, stats) => {
        if(!err && stats.isDirectory()) return cb(null, originalDir);
        if(dir === '/') return cb('Not in a gip project');
        findGipDir(dir + '../', cb);
    });
});

//getCommit :: CB workingDir commitObject
const getCommit = findGipDir
    .map(dir => dir + '/.gip/commit')
    .compose(readFile)
    .map(commit => commit.toString())
    .compose(getIPFSObject);

const updateRepo = CB.CBify((commitNode, cb) => {
    findGipDir(process.cwd(), (err, dir) => {
        DAGLink.create('master', commitNode.size, commitNode.multihash, (err, headCommitLink) => {
            DAGNode.create('repo', [headCommitLink], (err, repoNode) => {
                ipfs.object.put(repoNode, (err) => {
                    fs.writeFile(dir + '/.gip/repo', repoNode.toJSON().multihash, cb);
                });
            });
        });
    });
});


const init = () => {
    DAGNode.create('Initial commit', [], (err, initialCommitNode) => {
        ipfs.object.put(initialCommitNode, (err, initCommit) => {
            fs.mkdirSync('./.gip');
            fs.writeFile('./.gip/commit', initialCommitNode.toJSON().multihash, (err) => {
                console.log('gip initialised');
            });
        });
    });
};

const commit = () => {
    findGipDir(process.cwd(), (err, dir) => {
        if(err) return console.error(err);
        ipfs.util.addFromFs(dir, {recursive: true, ignore: fs.readFileSync(dir + '/.gitignore').toString().split("\n").concat(['.gip/**'])}, (err, res) => {
            if(err) return console.error(err);
            const projectNode = res.reverse()[0];
            DAGLink.create('fs', projectNode.size, projectNode.hash, (err, link) => {
                getCommit(process.cwd(), (err, commit) => {
                    commit = commit.toJSON();
                    DAGLink.create('previous', commit.size, commit.multihash, (err, comLink) => {
                        DAGNode.create('commit', [link, comLink], (err, commitNode) => {
                            ipfs.object.put(commitNode, (err, comNode) => {
                                fs.writeFile(dir + '/.gip/commit', comNode.toJSON().multihash, (err) => {
                                    updateRepo(comNode, (err, data) => {
                                        console.log(comNode.toJSON());
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
}

const clone = (name, hash) => {
    ipfs.object.get(hash, (err, repoNode) => {
        ipfs.object.get(repoNode.toJSON().links[0].multihash, (err, commitNode) => {
            fs.mkdir(name, (err) => {
                fs.mkdir(name + '/.gip', (err) => {
                    fs.writeFile(name + '/.gip/repo', hash, (err) => {
                        process.chdir(name + '/');
                        checkout(commitNode
                            .toJSON()
                            .links
                            .find(l => l.name === 'fs')
                            .multihash);
                    });
                });
            })
        });
    });
}

const checkout = (fsHash) => {
    findGipDir(process.cwd(), (err, dir) => {
        if(err) return console.error(err);
        ipfs.get(fsHash, (err, data) => {
            if(err) return console.error(err);
            data.on('end', () => {
                console.log('checked out' + fsHash);
            });
            data.pipe(through.obj((file, enc, next) => {
                if(file.path === fsHash) return next();
                file.path = file.path.substring(file.path.indexOf('/') + 1);
                if(!file.content) {
                    fs.mkdir(file.path, () => {
                        return next();
                    });
                    return;
                }
                file.content.on('end', next);
                file.content.pipe(fs.createWriteStream(file.path));
            }));
        });
    });
};
