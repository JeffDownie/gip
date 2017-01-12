var fs = require('fs');
var utils = require('../utils');
var findGipDir = utils.findGipDir;
var getCommit = utils.getCommit;
var ipfsApi = require('ipfs-api');
var ipfs = ipfsApi();
var DAG = require('ipld-dag-pb');
var DAGLink = DAG.DAGLink;
var DAGNode = DAG.DAGNode;

DAGNode.create('Initial commit', [], (err, initialCommitNode) => {
    ipfs.object.put(initialCommitNode, (err, initCommit) => {
        fs.mkdirSync('./.gip');
        fs.writeFile('./.gip/commit', initialCommitNode.toJSON().multihash, (err) => {
            console.log('gip initialised');
        });
    });
});
