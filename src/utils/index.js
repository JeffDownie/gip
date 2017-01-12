var ipfsApi = require('ipfs-api');
var ipfs = ipfsApi();
var fs = require('fs');
var DAG = require('ipld-dag-pb');
var DAGLink = DAG.DAGLink;
var DAGNode = DAG.DAGNode;

const findGipDir = cb => {
    const originalDir = process.cwd();
    fs.stat('.gip', (err, stats) => {
        if(!err && stats.isDirectory()) return cb(null, originalDir);
        if(originalDir === '/') return cb('Not in a gip project');
        process.chdir('..');
        findGipDir((err, dir) => {
            process.chdir(originalDir);
            cb(err, dir);
        });
    });
};

const getCommit = (cb) => {
    findGipDir((err, dir) => {
        fs.readFile(dir + '/.gip/commit', (err, data) => {
            ipfs.object.get(data.toString(), cb);
        });
    });
};

const updateRepo = (commitNode, cb) => {
    findGipDir((err, dir) => {
        DAGLink.create('master', commitNode.size, commitNode.multihash, (err, headCommitLink) => {
            DAGNode.create('repo', [headCommitLink], (err, repoNode) => {
                ipfs.object.put(repoNode, (err) => {
                    fs.writeFile(dir + '/.gip/repo', repoNode.toJSON().multihash, cb);
                });
            });
        });
    });
};

module.exports = {
    findGipDir: findGipDir,
    getCommit: getCommit,
    updateRepo: updateRepo
}
