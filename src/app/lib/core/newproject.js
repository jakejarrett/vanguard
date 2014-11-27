/*
var fs = require('fs');

var obj;

fs.readFile('file', 'utf8', function (err, data) {
    if (err) throw err;
    obj = JSON.parse(data);
});
*/
var defaultProject =
    '{ "projectInfo" :' +
        '{"tempo":"120","tracks":"4","name":"Untitled Project","location":"~/Projects/Project Name","effects":' +
            '[' +
                '[],' +
                '[],' +
                '[],' +
                '[]' +
            ']' +
        '}' +
    '}';

module.exports.newProject = defaultProject;