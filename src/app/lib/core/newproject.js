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

// New Project (This shouldn't be exported, So it should be fine to leave it as is for now)
var Project = JSON.parse(defaultProject),

bpm = Project['projectInfo'].tempo,
ProjectTitle = Project['projectInfo'].title,
ProjectLocation = Project['projectInfo'].location,
trackNumbers = Number(Project['projectInfo'].tracks);
