/*
    App.js - Initialize Application & Gather Resources
*/

var
	// Load native UI library
	gui = require('nw.gui'),

	// Native Window Object
	win = gui.Window.get(),

	// Operating System Object
	os = require('os'),

	// Path Object
	path = require('path'),

	// File System Object
	fs = require('fs'),

	// URL Object
	url = require('url'),

	// i18n module (translations)
	i18n = require('i18n'),

	// Default Project (New Project defaults)
	defaultproj = require('./lib/core/newproject.js'),

	// Settings
	settings = require('./settings.js'),

	// Project State (Move this to states.js ?)
	projectState = require('./lib/core/projectstate.js'),

	// Files JS
	file = require('./lib/core/files.js'),

	// Vanguard JS
	vanguard = require('./lib/vanguard/vanguard.js'),

	// VST Support
	VSTHost = require("node-vst-host").host,

	// Create VST Host
	host = new VSTHost(),

	// Application User Interface (Native Window etc)
	appUserInterface = {},

	// Application Handlers
	appHandler = {},

	// Default Views
	appView = {};

// newProject Info
var NewProject = JSON.parse(defaultproj.newProject),
	// Recording Variables
	micStream,
	activeRecorder,
	recordingCount = 1000,

	//array of track master gain nodes
	trackMasterGains = [],
	trackVolumeGains = [],
	trackInputNodes = [],
	trackCompressors = [],
	trackReverbs = [],
	trackFilters = [],
	trackDelays = [],
	trackTremolos = [],

	//the currently selected track (for editing effects etc.)
	activeTrack,

	//json of effect data
	effects,
	//contains AudioBuffer and id# of samples in workspace
	buffers = [],
	//contains start times of samples and their id#
	times = [],
	reverbIRs = [],
	//pixels per 16th note. used for grid snapping
	pixelsPer16 = 6,
	//pixels per 1/4 note	used for sample canvas size
	pixelsPer4 = 4*pixelsPer16,
	// Project BPM (Need to change this) maybe change this to newproject.bpm; & call all playback functionality once you're in a project?
	bpm = NewProject['projectInfo'].tempo,
	secondsPer16 = 0.25 * 60 / bpm,
	defaultTitle = NewProject['projectInfo'].title,
	defaultLocation = NewProject['projectInfo'].location,
	trackNumber = Number(NewProject['projectInfo'].tracks),
	// Set Global Vars for track management
	globalNumberOfTracks,
	globalWavesurfers = [];

// Window Variables for Global Settings.
window.togglePlay;
window.maximized;

// Play/Pause Stuff
if (isPlaying) {
	window.togglePlay = "Pause";
} else {
  window.togglePlay = "Play";
}

// Loading Screen
appUserInterface.initialize = function() {
	if(document.readyState = "complete") {
		// Implement react to create doms here instead?
		$( "#newpage" ).show();
		$( "#landingpage" ).show();
		$( "#landingpage-left" ).show();
		$( "#landingpage-right" ).show();
		$( "#project" ).hide();
		$( "#bpm" ).hide();
		$( ".projectnav" ).hide();
	} else {
		console.log("Waiting");
	}
};

// Vanguard Window Controls
appUserInterface.controls = function() {
	// Close Button
	$('.close-button').hover(
		function () {
			$('.close-button').toggleClass("hover");
			$('.minimize-button').toggleClass("hover");
			$('.fullscreen-button').toggleClass("hover");
		},
		function() {
			$('.close-button').toggleClass("hover");
			$('.minimize-button').toggleClass("hover");
			$('.fullscreen-button').toggleClass("hover");
		}
	).click(function(){
		win.close();
	});

	// Minimize Button
	$('.minimize-button').hover(
		function () {
			$('.close-button').toggleClass("hover");
			$('.minimize-button').toggleClass("hover");
			$('.fullscreen-button').toggleClass("hover");
		},
		function() {
			$('.close-button').toggleClass("hover");
			$('.minimize-button').toggleClass("hover");
			$('.fullscreen-button').toggleClass("hover");
		}
	).click(function(){
		win.minimize();
	});

	// Fullscreen Button
	$('.fullscreen-button').hover(
		function () {
			$('.close-button').toggleClass("hover");
			$('.minimize-button').toggleClass("hover");
			$('.fullscreen-button').toggleClass("hover");
		},
		function() {
			$('.close-button').toggleClass("hover");
			$('.minimize-button').toggleClass("hover");
			$('.fullscreen-button').toggleClass("hover");
		}
	).click(function(){
		win.toggleFullscreen();
	});

	// Headerbar
	$('#headerbar').dblclick(function(){
		if(window.maximized === false) {
			win.maximize();
			window.maximized = true;
		} else {
			win.unmaximize();
			window.maximized = false;
		}
	});
};

// Native Menubar for OSX
appUserInterface.menuBar = function() {
	if (process.platform !== "darwin") {
		return false;
	}

	var nativeMenuBar = new gui.Menu({ type: "menubar" }),
		file = new gui.Menu(),
		Window = new gui.Menu(),
		playback = new gui.Menu(),
		help = new gui.Menu(),
		debug = new gui.Menu(),
		clipboard = gui.Clipboard.get();

	nativeMenuBar.createMacBuiltin("Vanguard", {
		hideEdit: false,
		hideWindow: true
	});

	// Create File Menu
	nativeMenuBar.insert(
		new gui.MenuItem({
			label: 'File',
			submenu: file
		}), 1
	);

	// New Project
	file.append(
		new gui.MenuItem({
			label: 'New Project',
			click: function() {
				console.log("New Project");
				vanguard.newProject();
			},
			key: "n",
			modifiers: "cmd"
		})
	);

	// Open Project
	file.append(
		new gui.MenuItem({
			label: 'Open Project',
			click: function() {
				console.log("Open Project");
				vanguard.openProject();
			},
			key: "o",
			modifiers: "cmd"
		})
	);

	// Save Project
	file.append(
		new gui.MenuItem({
			label: 'Save Project',
			click: function() {
				console.log("Save Project");
				vanguard.saveProject();
			},
			key: "s",
			modifiers: "cmd"
		})
	);

	// Close Project
	file.append(
		new gui.MenuItem({
			label: 'Close Project',
			click: function() {
				console.log("Close Project");
				closeCurrent();
			},
			key: "w",
			modifiers: "cmd"
		})
	);


	// Seperator
	file.append (
		new gui.MenuItem({
			type: 'separator'
		})
	);

	// Install Instrument
	file.append(
		new gui.MenuItem({
			label: 'Install Instrument',
			click: function() {
				alert("sorry, not functional yet!");
			}
		})
	);

	// Create Window Menu
	nativeMenuBar.insert(
		new gui.MenuItem({
			label: 'Window',
			submenu: Window
		}), 3
	);

	// Minimize Window
	Window.append(
		new gui.MenuItem({
			label: 'Minimize',
			click: function() {
				win.minimize();
			},
			key: "m",
			modifiers: "cmd"
		})
	);

	// Zoom Window
	Window.append(
		new gui.MenuItem({
			label: 'Zoom',
			click: function() {
				var maximized = false;
				if(maximized === false) {
					win.maximize();
					maximized = true;
				} else {
					win.unmaximize();
				}
			}
		})
	);

	// Seperator
	Window.append (
		new gui.MenuItem({
			type: 'separator'
		})
	);

	// Bring all to Front
	Window.append(
		new gui.MenuItem({
			label: 'Bring All to Front',
			click: function() {
				win.focus();
			}
		})
	);

	// Create Playback Menu
	nativeMenuBar.insert(
		new gui.MenuItem({
			label: 'Playback',
			submenu: playback
		}), 3
	);

	// New Project
	playback.append(
		new gui.MenuItem({
			label: togglePlay,
			click: function() {
				$('body').trigger('playPause-event');
			}
		})
	);

	// Debugging Tools
	nativeMenuBar.append(
		new gui.MenuItem({
			label: 'Debug',
			submenu: debug
		}), 4
	);

	// Reset Timeline (Canvas)
	debug.append(
		new gui.MenuItem({
			label: 'Reset Canvas',
			click: function() {
				resetCanvas();
			}
		})
	);

	// Open CWD Folder
	debug.append(
		new gui.MenuItem({
			label: 'Open Folder',
			click: function() {
				gui.Shell.openItem('./');
			}
		})
	);

	// Seperator
	help.append (
		new gui.MenuItem({
			type: 'separator'
		})
	);

	// Dump current state of app to .debug file
	debug.append(
		new gui.MenuItem({
			label: 'Dump State',
			click: function() {
				var bodyState = document.getElementsByTagName('body');
				var bodyState = JSON.stringify(bodyState);
				fs.writeFile('state.debug', bodyState, function(err) {
					if (err) throw err;
					console.log('It\'s saved!');
				})
			}
		})
	);

	// Help Menu
	nativeMenuBar.append(
		new gui.MenuItem({
			label: 'Help',
			submenu: help
		}), 5
	);

	// DevTools
	help.append(
		new gui.MenuItem({
			label: 'Github',
			click: function() {
				gui.Shell.openExternal("https://github.com/jakejarrett/vanguard");
			}
		})
	);

	// Seperator
	help.append (
		new gui.MenuItem({
			type: 'separator'
		})
	);

	// DevTools
	help.append(
		new gui.MenuItem({
			label: 'DevTools',
			click: function() {
				win.showDevTools();
			}
		})
	);

	win.menu = nativeMenuBar;
};

appUserInterface.library = function() {

};

// Handle External Links
appHandler.external = function() {
	$('.open-external').click(function(e) {
		e.preventDefault();
		gui.Shell.openExternal($(this).attr('href'));
	});
};

// Handle Play (And Pause) events
appHandler.play = function() {
	$( "#playPause" ).click(function() {
		var $this = $(".icon-playpause");

		if ($this.hasClass("fa-play")) {
			$this.removeClass("fa-play").addClass("fa-pause");
			return;
		}

		if ($this.hasClass("fa-pause")) {
			$this.removeClass("fa-pause").addClass("fa-play");
			return;
		}

	}).dblclick(function(){
		return false;
	});

	Mousetrap.bind(['space'], function (e) {
		$('body').trigger('playPause-event');
		var $this = $(".icon-playpause");

		if ($this.hasClass("fa-play"))
		{
		$this.removeClass("fa-play").addClass("fa-pause");
		return;
		}
		if ($this.hasClass("fa-pause"))
		{
		$this.removeClass("fa-pause").addClass("fa-play");
		return;
		}
	});
};

// Handle Stop events
appHandler.stop = function() {
	$( "#stop" ).click(function() {
		var $this = $(".icon-playpause");
		if(isPlaying == true) {
			if ($this.hasClass("fa-pause")) {
				$this.removeClass("fa-pause").addClass("fa-play");
				return;
			}
		}
	}).dblclick(function(){
		return false;
	});
};

// Write Errors to error.log
appHandler.logError = function(data) {
	fs.appendFile('error.log', data, function(err) {
		if (err) throw err;
		console.log(data);
	})
};

// Handle DevTools Event
appHandler.devtools = function() {
	$('.open-devtools').click(function(e) {
		win.showDevTools();
	});
};

// Handle Clock Event/Info
appHandler.clock = function() {
	$("#clock").dblclick(function(){
		return false;
	})
};

// Handle Wavesurfer Timeline
appHandler.timeline = function() {
	$("#zoomOut").dblclick(function(){
		return false;
	});

	Mousetrap.bind(['-'], function(e) {
		$('body').trigger('zoomOut-event');
	});

	$("#zoomIn").dblclick(function(){
		return false;
	});

	Mousetrap.bind(['+'], function(e) {
		$('body').trigger('zoomIn-event');
	});


	if(projectState.currentState == "newProject") {
		drawTimeline();
		resetCanvas();
	}
};

// Handle Updates for Application
appHandler.update = function() {
	//
};

appView.landingPage = function() {
	//
};

appView.project = function () {
	// Clear landing page & create the project page with Data binding & provide a much nicer way to interact with app
};

initSched({
	bufferArray: buffers,
	audioContext: ac
});

// Playback & Timeline Event Handlers ()
$('body').bind('playPause-event', function(e){
	schedPlay(ac.currentTime);
});

$('body').bind('stop-event', function(e){
  schedStop();
});

$('body').bind('stepBackward-event', function(e){
	schedStepBack(ac.currentTime);
});

$('body').bind('stepForward-event', function(e){
	schedStepAhead(ac.currentTime);
});

$('body').bind('mute-event', function(e, trackNumber){
  muteTrack(trackNumber);
});

$('body').bind('solo-event', function(e, trackNumber){
  solo(trackNumber);
});

$('body').bind('zoomIn-event', function(e){
  timelineZoomIn();
});

$('body').bind('zoomOut-event', function(e){
  timelineZoomOut();
});

function startUserMedia(stream) {
	micStream = stream;
}

// try new approach
window.addEventListener("load", function() {
	try {
		window.URL = window.URL || window.webkitURL;
	} catch (e) {
		alert('No web audio support in this browser!');
	}

	navigator.webkitGetUserMedia({audio: true}, startUserMedia, function(e) {

	});
});

window.addEventListener("load", initSched);

appHandler.shortcuts = function() {
	// Shortcuts
	Mousetrap.bind(['shift+f12', 'f12', 'mod+/'], function (e) {
		e.preventDefault();
		win.showDevTools();
	});

	Mousetrap.bind('mod+,', function (e) {
		console.log(e);
		// Open Settings
		$('#settings').modal('toggle');
	});
};

// Fullscreen for OS X
if (process.platform === 'darwin') {
	Mousetrap.bind('mod+ctrl+f', function (e) {
		e.preventDefault();
		win.toggleFullscreen();
		// Toggle button when user enters Fullscreen

		var $this = $(".icon-fullscreen");
		if ($this.hasClass("fa-expand")) {
			$this.removeClass("fa-expand").addClass("fa-compress");
			return;
		}

		if ($this.hasClass("fa-compress")) {
			$this.removeClass("fa-compress").addClass("fa-expand");
			return;
		}
	});
} else {
	Mousetrap.bind('mod+alt+f', function (e) {
		e.preventDefault();
		win.toggleFullscreen();
		// Toggle button when user enters Fullscreen
		var $this = $(".icon-fullscreen");
		if ($this.hasClass("fa-expand")) {
			$this.removeClass("fa-expand").addClass("fa-compress");
			return;
    }
		if ($this.hasClass("fa-compress"))	{
			$this.removeClass("fa-compress").addClass("fa-expand");
			return;
		}
	});
}

// -f argument to open in fullscreen
if (gui.App.fullArgv.indexOf('-f') !== -1) {
	win.enterFullscreen();
}

// Show 404 page on uncaughtException
process.on('uncaughtException', function (err) {
	// Log error
	window.console.error(err, err.stack);

	// Write error into Modal contents
	$("#error-contents").html(err);
	// Toggle Modal
	$('#error').modal('toggle');

	// Write error to error.log in the root directory
	appHandler.logError(err);
});

// Start App
$(document).ready( function () {
	// Initialize Application UI
	appUserInterface.initialize();
	appUserInterface.controls();
	appUserInterface.menuBar();

	// App Handlers
	appHandler.external();
	appHandler.play();
	appHandler.stop();
	appHandler.devtools();
	appHandler.clock();
	appHandler.timeline();
	appHandler.shortcuts();
});
