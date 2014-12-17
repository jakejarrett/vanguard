/*
    Vanguard.js

    What will vanguard do?

    Vangurd will handle what to do when you have created a new project and/or opened a project (Will be expanded upon in the future.)

    Move all newproject functions into this from app.js
*/

var projectstate = require('../core/projectstate.js'),
    defaultProject = require('../core/newproject.js'),
    newProject = JSON.parse(defaultProject.newProject),
    exports = module.exports = {};

// We use the currentState from projectstate to ensure the user wanted to create a project or open a project. (This isn't required.)

// Create a Project
exports.newProject = function() {
    if(projectstate.currentState == undefined) {
        console.log("Oops, seems the project state is undefined!");
    }

    if(projectstate.currentState == "newProject") {
        // We define the core Variables of Vanguard inside of this IF statement to allow easier functionality
        var bpm = newProject['projectInfo'].tempo,
            secondsPer16 = 0.25 * 60 / bpm,
            defaultTitle = newProject['projectInfo'].title,
            defaultLocation = newProject['projectInfo'].location,
            trackNumber = Number(newProject['projectInfo'].tracks);

            return newProject;
    }
};

// Open a Project
exports.openProject = function() {
    if(projectstate.currentState == undefined) {
        console.log("Oops, seems the project state is undefined!");
    }
};
