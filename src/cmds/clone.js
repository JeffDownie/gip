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
    fs.mkdir(name, (err) => {
        fs.mkdir(name + '/.gip', (err) => {
            fs.writeFile(name + '/.gip/repo', hash, (err) => {
                console.log('cloned');
                //TODO: checkout anything
            });
        });
    })
}
