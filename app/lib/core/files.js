// Open a file
exports.Open = function(name) {
    var fs = require('fs'),
    EventEmitter = require('events').EventEmitter,
    event = new EventEmitter(),
    chooser = window.document.querySelector(name);
    chooser.addEventListener("change", function(evt) {
        // console.log(this.value);
        fs.readFile(this.value, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
          event.emit('finishOpening', event);
        });
    }, false);

    chooser.click();
}

// Save a file
exports.Save = function(name) {
    // Replace testSave with actual data, This was just to test how to handle the saving function
    // Will probably make it grab all the Project Info on Save so it doesn't try to constantly update an object/json
    var testSave = JSON.stringify(NewProject['projectInfo'], null, 4),
    fs = require('fs'),
    saver = window.document.querySelector(name);
    saver.addEventListener("change", function(evt) {
        // Write to selected file via node's writeFile()
        fs.writeFile(this.value, testSave, function (err,data) {
            if (err) {
                return console.log(err);
                alert(err);
            }
        });

        // This is a Debug feature to ensure saving works. Maybe have an option to enable this by --debug ?
        fs.readFile(this.value, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            console.log(data);
        });

    }, false);

    saver.click();
}
