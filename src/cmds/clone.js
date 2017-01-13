var fs = require('fs');
var ipfsApi = require('ipfs-api');
var ipfs = ipfsApi();
var utils = require('../utils');
var findGipDir = utils.findGipDir;
var getCommit = utils.getCommit;
var DAG = require('ipld-dag-pb');
var DAGLink = DAG.DAGLink;
var DAGNode = DAG.DAGNode;

module.exports = (name, hash) => {
    ipfs.object.get(hash, (err, repoNode) => {
        ipfs.object.get(repoNode.toJSON().links[0].multihash, (err, commitNode) => {
            fs.mkdir(name, (err) => {
                fs.mkdir(name + '/.gip', (err) => {
                    fs.writeFile(name + '/.gip/repo', hash, (err) => {
                        process.chdir(name + '/');
                        require('./checkout')(commitNode
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
