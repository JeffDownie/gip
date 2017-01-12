var fs = require('fs');
var ipfsApi = require('ipfs-api');
var ipfs = ipfsApi();
var utils = require('../utils');
var findGipDir = utils.findGipDir;
var getCommit = utils.getCommit;
var DAG = require('ipld-dag-pb');
var DAGLink = DAG.DAGLink;
var DAGNode = DAG.DAGNode;
var through = require('through2');

module.exports = (hash) => {
    findGipDir((err, dir) => {
        if(err) return console.error(err);
        ipfs.get(hash, (err, data) => {
            data.pipe(through.obj((file, enc, next) => {
                if(file.path === hash) return next();
                file.path = file.path.substring(file.path.indexOf('/') + 1);
                console.log(file.path)
                if(!file.content) {
                    fs.mkdir(file.path, () => {
                        return next();
                    });
                    return;
                }
                file.content.on('end', next);
                file.content.pipe(fs.createWriteStream(file.path));
            }, () => {
                console.log('checked out ' + hash);
            }));
        });
    });
};
