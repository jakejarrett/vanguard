/*
    Vanguard.js - Essentials of the DAW Functionality.
*/

var projectState = require('../core/projectstate.js'),
    defaultProject = require('../core/newproject.js'),
    files = require('../core/files.js'),
    ac = new (window.AudioContext),
    masterGainNode = ac.createGain(),
    $ = require('jquery')(window),
    newProject = JSON.parse(defaultProject.newProject),
    exports = module.exports = {},
    globalNumberOfTracks = 0,
    effects = {},
    trackMasterGains = {};

// Hide a DOM
function hide(name) {
  if(name != null) {
    console.log(name);
    window.document.getElementById(name).style.display = 'none';
  } else {
    alert(name);
  }
}

// Show a DOM
function show(name) {
  if(name != null) {
    console.log(name);
    window.document.getElementById(name).style.display = 'block';
  } else {
    alert(name);
  }
}

// Change the contents of a DOM
function html(name, content) {
  if(name != null) {
    console.log(name);
    console.log(content);
    window.document.getElementByClassName(name).innerHTML = content;
  } else {
    alert(name);
  }
}

// Append contents to a DOM
function append(name, content) {
  if(name != null) {
    var div = window.document.getElementById(name);
    div.innerHTML = div.innerHTML + content;
  } else {
    return false;
  }
}

// Mute Track
function muteTrack(trackNumber) {
  console.log(trackNumber);

  var mute = window.document.querySelectorAll('button[id^="mute"]');
  // Mute Track

  // $(this).button('toggle');
  // var muteTrackNumber = $(this).attr('id').split('mute')[1];
  // $('body').trigger('mute-event', muteTrackNumber);
}

// Create Track
function createTrack(trackNumber) {
  // Create Track DIV
  var track = "<div id='track"+trackNumber+"' class='span10 track'></div>";

  // Create Track Controls
  var controls = "<div class='row-fluid trackController' id='selectTrack"+trackNumber+"'>";
      controls += "<div class='span2 trackBox'>";
      controls += "<p class='trackID btn btn-default' id='track"+trackNumber+"title'>Track "+trackNumber+"</p>";
      controls += "<div class='btn-toolbar' style='margin-top: 0px;'>";
      controls += "<div class='btn-group'>";
      controls += "<button type='button' class='btn btn-default btn-sm' id = 'solo"+trackNumber+"'><i class='fa fa-headphones'></i></button>";
      controls += "<button type='button' class='btn btn-default btn-sm' id = 'mute"+trackNumber+"'><i class='fa fa-volume-off'></i></button>";
      controls += "<button type='button' class='btn btn-default btn-sm' onClick='vanguard.removeTrack("+trackNumber+");' id = 'remove"+trackNumber+"'><i class='fa fa-minus'></i></button>";
      controls += "</div>";
      controls += "<div class='btn-group'>";
      controls += "<button type='button' class='btn btn-default btn-sm' data-toggle='button' id = 'record"+trackNumber+"'><i class='fa fa-microphone'></i></button>";
      controls += "<button type='button' class='btn btn-default btn-sm volumePop' data-toggle='popover' id = 'volumePopover"+trackNumber+"'><i class='fa fa-volume-up'></i></button>";  // Need to add Volume control here.
      controls += "</div>";
      controls += "</div>";
      controls += "</div>";
      controls += "</div>";
      controls += "<div class='pushTrackDIV' id='push"+trackNumber+"'></div>";

  append("tracks", track);
  append("trackControls", controls);

}

// Remove Track
function removeTrack(trackNumber) {
  if (trackNumber == "") {
    return false;
  } else if(trackNumber == "*") {
    // Remove ALL tracks
    var timelineDIV = window.document.querySelectorAll(".track");
    Array.prototype.forEach.call( timelineDIV, function( node ) {
      node.parentNode.removeChild( node );
    });

    // Remove Track Controls for that Track/Channel
    var trackDIV = window.document.querySelectorAll(".trackController");
    Array.prototype.forEach.call( trackDIV, function( node ) {
      node.parentNode.removeChild( node );
    });

    // Remove "pushID" which fixes some CSS
    var pushDIV = window.document.querySelectorAll(".pushTrackDIV");
    Array.prototype.forEach.call( pushDIV, function( node ) {
      node.parentNode.removeChild( node );
    });

    // reset variables
    trackNumber = 0;
    globalNumberOfTracks = 0;
    newTrackNumber = 1;

    // Debugging
    console.log(trackNumber);
  } else if(trackNumber != null) {
    // Remove Timeline for that Track/Channel
    var timelineDIV = window.document.getElementById("track" + trackNumber);
    timelineDIV.remove();

    // Remove Track Controls for that Track/Channel
    var trackDIV = window.document.getElementById("selectTrack" + trackNumber);
    trackDIV.remove();

    // Remove "pushID" which fixes some CSS
    var pushDIV = window.document.getElementById("push" + trackNumber);
    pushDIV.remove();

    // Remove 1 from Global Number of Tracks & The New track Number
    globalNumberOfTracks--;
    newTrackNumber--;

    // Output what track you removed (This is more a debug feature)
    console.log('Track ' + trackNumber + ' Removed');

  } else {
    return false;
  }
}

// Export Create & Remove Track(s) so they can be used outside of vanguard.js
exports.createTrack = createTrack;
exports.removeTrack = removeTrack;
exports.muteTrack = muteTrack;

// Create a Project
exports.newProject = function() {
  // Define all of the needed Variables first
  var bpm = newProject['projectInfo'].tempo,
      secondsPer16 = 0.25 * 60 / bpm,
      defaultTitle = newProject['projectInfo'].title,
      defaultLocation = newProject['projectInfo'].location,
      trackNumber = Number(newProject['projectInfo'].tracks);

  if(projectState.currentState != null) {
    var confirmNew = window.confirm("Do you wish to dismiss Changes?");
    if(confirmNew == true){
      // default the project, this way we can prevent adding multiple new projects onto each other
      removeTrack("*");
      // Reset Timeline / Scheduler
      // schedStop();
    }
  }

  // Show
  show("bpm");
  show("project");
  show("projectNav");
  show("projectTitle");
  show("projectRight");
  show("tracks");
  show("trackControls");

  // Hide
  hide("newpage");
  hide("landingpage");

  // Change Title & Location - Needs to be fixed
  // html("title", defaultTitle);
  // html("project", defaultLocation);

  projectState.currentState = "newProject";

  // Create 4 Tracks, Need to handle this better.
  createTrack(1);
  createTrack(2);
  createTrack(3);
  createTrack(4);

  globalNumberOfTracks = 4;
  newTrackNumber = 5;

  // Log Project state, This is for debugging purposes.
  console.log(projectState);

  return newProject;
};

// Open a Project
exports.openProject = function() {
  if(projectState.currentState == undefined) {
    files.Open('#openfileDialog');
    // use promises instead of if statement.
    opener = window.document.querySelector('#openfileDialog');
    event.once('connection', function (stream) {
      console.log('Ah, we have our first user!');
    });
  }
};

// Save a Project
exports.saveProject = function() {
  if(projectState.currentState == undefined) {
    console.log("Oops, seems the project state is undefined! (usually means you're in the landing page)");
    window.alert("Oops, You can't save when you're not in a project!")
  } else if(projectState.currentState == "openProject") {

  }
};

// Close Project
exports.closeProject = function() {
  if(projectState.currentState != null) {
    var confirmExit = window.confirm('Do You wish to close this project?');
    if(confirmExit == true) {
      // Show content
      show("newpage");
      show("landingpage");

      // Hide Content
      hide("project");
      hide("bpm");
      hide("projectTitle");
      hide("projectNav");
      hide("projectRight");

      // Empty Tracks & trackControls
      removeTrack("*");

      // Stop Timeline & Reset back to 0
      window.resetCanvas();

      // Reset Project State
      projectState.currentState = null;

      // Log Project State
      console.log(projectState);
    } else return false;
  }
}

// Add Channel
exports.addChannel = function() {
    var newTrackNumber = globalNumberOfTracks+1;

    globalNumberOfTracks++;

    if(globalNumberOfTracks>4){
        var sidebarClass = window.document.getElementById("channelSidebar");
            currentSideBarHeight = parseInt(sidebarClass.offsetHeight);
        currentSideBarHeight+=90;
        currentHeight = sidebarClass.style.size;
        sidebarClass.style.size = currentHeight + currentSideBarHeight;
    }

    createTrack(newTrackNumber);

    var trackMasterGainNode = ac.createGain();
        trackInputNode = ac.createGain(),
        trackVolumeNode = ac.createGain(),
        //array of track master gain nodes
        trackMasterGains = [],
        trackVolumeGains = [],
        trackInputNodes = [],
        trackCompressors = [],
        trackReverbs = [],
        trackFilters = [],
        trackDelays = [],
        trackTremolos = [];

    trackMasterGainNode.connect(masterGainNode);
    trackVolumeNode.connect(trackMasterGainNode);
    trackInputNode.connect(trackVolumeNode);
    trackMasterGains[newTrackNumber] = {node: trackMasterGainNode, isMuted: false, isSolo: false};
    trackVolumeGains[newTrackNumber] = trackVolumeNode;
    trackInputNodes[newTrackNumber] = trackInputNode;
}

// List Channels
exports.listChannels = function() {
    var timelineDIV = window.document.querySelectorAll(".track");
    var numberOfChannels = timelineDIV.length;

    for(var i=0;i<numberOfChannels;i++){
      var trackList = 'track' + i;
      console.log(trackList);
    }
}

// Export Project (This will be expanded on when this is enabled)
exports.exportProject = function() {

}
