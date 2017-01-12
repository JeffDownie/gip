var fs = require('fs');
var ipfsApi = require('ipfs-api');
var ipfs = ipfsApi();
var utils = require('../utils');
var findGipDir = utils.findGipDir;
var getCommit = utils.getCommit;
var DAG = require('ipld-dag-pb');
var DAGLink = DAG.DAGLink;
var DAGNode = DAG.DAGNode;

findGipDir((err, dir) => {
    if(err) return console.error(err);
    ipfs.util.addFromFs(dir, {recursive: true, ignore: fs.readFileSync(dir + '/.gitignore').toString().split("\n").concat(['.gip/**'])}, (err, res) => {
        if(err) return console.error(err);
        var projectNode = res.reverse()[0];
        DAGLink.create('fs', projectNode.size, projectNode.hash, (err, link) => {
            getCommit((err, commit) => {
                commit = commit.toJSON();
                DAGLink.create('previous', commit.size, commit.multihash, (err, comLink) => {
                    DAGNode.create('commit', [link, comLink], (err, commitNode) => {
                        ipfs.object.put(commitNode, (err, comNode) => {
                            fs.writeFile(dir + '/.gip/commit', comNode.toJSON().multihash, (err) => {
                                utils.updateRepo(comNode, (err, data) => {
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
