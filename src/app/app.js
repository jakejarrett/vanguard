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
window.togglePlay = "";
window.maximized = "";

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

// Native Menubar for OSX (Frameless windows are not supported on Windows & Linux?)
appUserInterface.menuBar = function() {
	if (process.platform !== "darwin") {
		return false;
	}

	var nativeMenuBar = new gui.Menu({ type: "menubar" }),
		file = new gui.Menu(),
		Window = new gui.Menu(),
		playback = new gui.Menu(),
		help = new gui.Menu(),
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

	// Minimize Window
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

	// Help Menu
	nativeMenuBar.append(
		new gui.MenuItem({
			label: 'Help',
			submenu: help
		}), 4
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

// Handle DevTools Event (Single event in the HTML menu in the headerbar)
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

};

// appView = Views / Pages. Take a reactJS approach and init all dom's via Objects.
appView.landingPage = function() {
	// Clear out DOM, Create a landing page & drop all variables that are not vital to the application.
};

appView.project = function () {
	// Clear landing page & create the project page with Data binding & provide a much nicer way to interact with app
};

var wavesurfer = (function () {
    'use strict';

    var createWavesurfer = function (song) {
        var startTimes = song.startTime,
        	sampleNumber = 0,
        	sampleUrl = song.url.split("/"),
        	sampleTitle = sampleUrl[sampleUrl.length-1],
        	obj;
		// Will need to clean this up
        $("#libraryList").append("<li id=librarySample" + song.id +" class='librarySample' data-id="+song.id+" data-url="+song.url+" data-duration="+song.duration+"><a href='#'>" + sampleTitle + "</a></li>");
        $("#librarySample" + song.id).draggable({
            revert: true,
            helper: "clone",
            start: function(event, ui) { $(this).css("z-index", 10); }
        });
        $.each(startTimes, function(){
	    if(sampleNumber == 0){
		obj = ({bufferURL: song.url, id: song.id, startTimes: song.startTime, track: song.track});
	    }
	    var currentStartTime = song.startTime[sampleNumber],
			span = document.createElement('span');
		span.id = "sample" + song.id + "Span" + sampleNumber;
		var canvas = document.createElement('canvas');
	    canvas.className = "sample";
		canvas.id = "sample" + song.id + "Canvas" + sampleNumber;
		$("#track"+song.track).append(span);
		$("#sample" + song.id + "Span" + sampleNumber).append(canvas);
		$("#sample" + song.id + "Span" + sampleNumber).width(parseFloat(song.duration) * ((pixelsPer4*bpm)/60));
		// Wavesurfer Dimension Control
		canvas.width = parseFloat(song.duration) * ((pixelsPer4*bpm)/60);
		canvas.height = 80;
		$( "#sample" + song.id + "Span" + sampleNumber).attr('data-startTime',song.startTime[sampleNumber]);
		$( "#sample" + song.id + "Span" + sampleNumber).css('left',"" + parseInt(currentStartTime*pixelsPer16) + "px");
		$( "#sample" + song.id + "Span" + sampleNumber).css('position','absolute');
		$( "#sample" + song.id + "Span" + sampleNumber).draggable({
			axis: "x",
			containment: "parent",
			grid: [pixelsPer16, 0],		//grid snaps to 16th notes
			stop: function() {
				//get rid of old entry in table
				var currentStartBar = $(this).attr('data-startTime');
				times[currentStartBar] = jQuery.removeFromArray(song.id, times[currentStartBar]);
				$(this).attr('data-startTime',parseInt($(this).css('left'))/pixelsPer16);
				var newStartTime = $(this).attr('data-startTime');
				if(times[newStartTime] == null){
					times[newStartTime] = [{id: song.id, track: song.track}];
				} else {
					times[newStartTime].push({id: song.id, track: song.track});
				}
			}
		});
	    $( "#sample" + song.id + "Span" + sampleNumber ).resizable({
		helper: "ui-resizable-helper",
		handles: "e",
		grid: pixelsPer16
	    });
            var wavesurfer = Object.create(WaveSurfer);
            wavesurfer.init({
                canvas: canvas,
                waveColor: '#08c',
                progressColor: '#08c',
                loadingColor: 'purple',
                cursorColor: 'navy',
                audioContext: ac
            });
            wavesurfer.load(song.url);
	    globalWavesurfers.push(wavesurfer);
            sampleNumber++;
        });

        return obj;
    };


    var processData = function (json) {
		// Process JSON Data (New Project)
		// Still inside of a wavesurfer instance.
        var numberOfTracks = Number(NewProject['projectInfo'].tracks);
        effects = NewProject['projectInfo'].effects;
        var trackNumber = Number(NewProject['projectInfo'].tracks);
        //create track-specific nodes
        globalNumberOfTracks = numberOfTracks;
        createNodes(numberOfTracks);

        for(var i=0;i<numberOfTracks;i++){
	   var currentTrackNumber = i+1;
	    createTrack(currentTrackNumber);
	    $.each(effects[i],function(){
		if(this.type == "Compressor"){
		    var trackCompressor = ac.createDynamicsCompressor();
		    var inputNode = trackInputNodes[currentTrackNumber];
		    var volumeNode = trackVolumeGains[currentTrackNumber];
		    inputNode.disconnect();
		    inputNode.connect(trackCompressor);
		    trackCompressor.connect(volumeNode);
		    trackCompressors[currentTrackNumber] = trackCompressor;
		}
		if(this.type == "Filter"){
		    var trackFilter = ac.createBiquadFilter();
		    var inputNode = trackInputNodes[currentTrackNumber];
		    var volumeNode = trackVolumeGains[currentTrackNumber];
		    inputNode.disconnect();
		    inputNode.connect(trackFilter);
		    trackFilter.connect(volumeNode);
		    trackFilters[currentTrackNumber] = trackFilter;
		}
	    });
    }
        // wavesurfers is an array of all tracks
        var wavesurfers = json.samples.map(createWavesurfer);
        $.each(wavesurfers, function(){
	    var currentSample = this;
	    // if they are in workspace...
	    if(currentSample != undefined){
            //load the buffer
            load(currentSample.bufferURL, currentSample.id);
            //store the times
            $.each(currentSample.startTimes, function(){
                var currentStartTime = this;
                if(times[currentStartTime] == null){
                    times[currentStartTime] = [{id: currentSample.id, track: currentSample.track}];
                } else {
                    times[currentStartTime].push({id: currentSample.id, track: currentSample.track});
                }
            });
        }
        });
    };
}());

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

// Initialize all the divs on ready (Probably move this to when you have opened/created a project?)
$(document).ready(function(){
    $(".effectDrag").draggable({
	revert: true,
	helper: "clone"
    });

    $("#effectSortable").sortable({
	cancel: "canvas,input",
	/*
	sort: function(event, ui){
	     console.log($( "#effectSortable" ).sortable( "toArray" ))
	}*/

    });

    $("#trackEffects").droppable({
	accept: ".effectDrag",
	drop: function(event, ui){
	    $("#"+ui.draggable[0].textContent).removeClass('hidden');
	    if(ui.draggable[0].textContent == "Reverb"){
		$("#reverbIrSelectKnob").val(0).trigger('change');
		$("#reverbWetDryKnob").val(50).trigger('change');


		var trackReverb = createTrackReverb();
		var inputNode = trackInputNodes[activeTrack];
		var volumeNode = trackVolumeGains[activeTrack];

		inputNode.disconnect();
		inputNode.connect(trackReverb[0]);

		if (trackFilters[activeTrack] != null ) {
		    trackReverb[1].connect(trackFilters[activeTrack]);
		}else if (trackCompressors[activeTrack != null]) {
		    trackReverb[1].connect(trackCompressors[activeTrack]);
		}else if (trackTremolos[activeTrack != null]) {
		    trackReverb[1].connect(trackTremolos[activeTrack][0]);
		}else if(trackDelays[activeTrack] != null){
		    trackReverb[1].connect(trackDelays[activeTrack][0]);
		}else{
		    trackReverb[1].connect(volumeNode);
		}

		trackReverbs[activeTrack] = trackReverb;
		effects[activeTrack-1].push({
		    type: "Reverb",
		    ir:  "0",
		    wetDry: "50"
		});
	    }
	    if(ui.draggable[0].textContent == "Filter"){
		$("#filterCutoffKnob").val(30).trigger('change');
		$("#filterQKnob").val(1).trigger('change');
		$("#filterTypeKnob").val(0).trigger('change');
		var trackFilter = ac.createBiquadFilter();
		var inputNode = trackInputNodes[activeTrack];
		var volumeNode = trackVolumeGains[activeTrack];

		if (trackReverbs[activeTrack] != null) {
		    trackReverbs[activeTrack][1].disconnect();
		    trackReverbs[activeTrack][1].connect(trackFilter);
		}else {
		    inputNode.disconnect();
		    inputNode.connect(trackFilter);
		}

		if (trackCompressors[activeTrack] != null){
		    trackFilter.connect(trackCompressors[activeTrack]);
		}else if (trackTremolos[activeTrack != null]) {
		    trackFilter.connect(trackTremolos[activeTrack][0]);
		}else if(trackDelays[activeTrack] != null){
		    trackFilter.connect(trackDelays[activeTrack][0]);
		}else{
		    trackFilter.connect(volumeNode);
		}

		trackFilters[activeTrack] = trackFilter;
		effects[activeTrack-1].push({
		    type: "Filter",
		    cutoff: "30",
		    q: "1",
		    filterType: "0"
		});
	    }
	    if(ui.draggable[0].textContent == "Compressor"){
		$("#compressorThresholdKnob").val(-24).trigger('change');
		$("#compressorRatioKnob").val(12).trigger('change');
		$("#compressorAttackKnob").val(3).trigger('change');
		var trackCompressor = ac.createDynamicsCompressor();
		var inputNode = trackInputNodes[activeTrack];
		var volumeNode = trackVolumeGains[activeTrack];

		if (trackFilters[activeTrack] != null){
		    trackFilters[activeTrack].disconnect();
		    trackFilters[activeTrack].connect(trackCompressor);
		}else if (trackReverbs[activeTrack] != null) {
		    trackReverbs[activeTrack][1].disconnect();
		    trackReverbs[activeTrack][1].connect(trackCompressor);
		}else {
		    inputNode.disconnect();
		    inputNode.connect(trackCompressor);
		}

		 if (trackTremolos[activeTrack != null]) {
		    trackCompressor.connect(trackTremolos[activeTrack][0]);
		}else if (trackDelays[activeTrack] != null) {
		    trackCompressor.connect(trackDelays[activeTrack][0]);
		}else{
		    trackCompressor.connect(volumeNode);
		}

		trackCompressors[activeTrack] = trackCompressor;
		effects[activeTrack-1].push({
		    type: "Compressor",
		    threshold: "-24",
		    ratio: "12",
		    attack: ".003"
		});
		//console.log(effects[activeTrack-1]);
	    }
	    if(ui.draggable[0].textContent == "Tremolo"){

		$("#tremoloRateKnob").val(1).trigger('change');
		$("#tremoloDepthKnob").val(10).trigger('change');
		var trackTremolo = createTrackTremolo();
		var inputNode = trackInputNodes[activeTrack];
		var volumeNode = trackVolumeGains[activeTrack];

		if (trackCompressors[activeTrack] != null){
		    trackCompressors[activeTrack].disconnect();
		    trackCompressors[activeTrack].connect(trackTremolo[0]);
		}else if(trackFilters[activeTrack] != null) {
		    trackFilters[activeTrack].disconnect();
		    trackFilters[activeTrack].connect(trackTremolo[0]);
		}else if (trackReverbs[activeTrack] != null) {
		    trackReverbs[activeTrack][1].disconnect();
		    trackReverbs[activeTrack][1].connect(trackTremolo[0]);
		}else {
		    inputNode.disconnect();
		    inputNode.connect(trackTremolo[0]);
		}

		if (trackDelays[activeTrack] != null) {
		    trackTremolo[1].connect(trackDelays[activeTrack][0]);
		}else{
		    trackTremolo[1].connect(volumeNode);
		}

		trackTremolos[activeTrack] = trackTremolo;
		effects[activeTrack-1].push({
		    type: "Tremolo",
		    rate: "1",
		    depth: "10"
		});
		//console.log(effects[activeTrack-1]);
	    }
	    if(ui.draggable[0].textContent == "Delay"){
		$("#delayTimeKnob").val(1).trigger('change');
		$("#delayFeedbackKnob").val(20).trigger('change');
		$("#delayWetDryKnob").val(50).trigger('change');
		var trackDelay = createTrackDelay();
		var inputNode = trackInputNodes[activeTrack];
		var volumeNode = trackVolumeGains[activeTrack];

		if (trackFilters[activeTrack] != null){
		    trackFilters[activeTrack].disconnect();
		    trackFilters[activeTrack].connect(trackDelay[0]);
		}else if (trackReverbs[activeTrack] != null) {
		    trackReverbs[activeTrack][1].disconnect();
		    trackReverbs[activeTrack][1].connect(trackDelay[0]);
		}else if(trackCompressors[activeTrack] != null) {
		    trackCompressors[activeTrack].disconnect();
		    trackCompressors[activeTrack].connect(trackDelay[0]);
		}else if(trackTremolos[activeTrack] != null) {
		    trackTremolos[activeTrack][1].disconnect();
		    trackTremolos[activeTrack][1].connect(trackDelay[0]);
		}else{
		    inputNode.disconnect();
		    inputNode.connect(trackDelay[0]);
		}

		trackDelay[1].connect(volumeNode);

		trackDelays[activeTrack] = trackDelay;
		effects[activeTrack-1].push({
		    type: "Delay",
		    time: "1",
		    feedback: "20",
		    wetDry: "50"
		});
	    }




	}

    });

    $("#compressorThresholdKnob").knob({
	change : function(v) {
	    setCompressorThresholdValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Compressor"){
		    this.threshold = v;
		}
	    });
	}
    });

    $("#compressorRatioKnob").knob({
	change : function(v) {
	    setCompressorRatioValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Compressor"){
		    this.ratio = v;
		}
	    });
	}
    });

    $("#compressorAttackKnob").knob({
	change : function(v) {
	    setCompressorAttackValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Compressor"){
		    this.attack = v/1000;
		}
	    });
	}
    });

    $("#filterCutoffKnob").knob({
	change : function(v) {
	    setFilterCutoffValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Filter"){
		    this.cutoff = v;
		}
	    });
	}
    });

    $("#filterQKnob").knob({
	change : function(v) {
	    setFilterQValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Filter"){
		    this.q = v;
		}
	    });
	}
    });

    $("#filterTypeKnob").knob({
	change : function(v) {
	    setFilterType(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Filter"){
		    this.filterType = v;
		}
	    });
	}
    });

    $("#reverbWetDryKnob").knob({
	change : function(v) {
	    setReverbWetDryValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Reverb"){
		    this.wetDry = v;
		}
	    });
	}
    });

    $("#reverbIrSelectKnob").knob({
	change : function(v) {
	    setReverbIr(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Reverb"){
		    this.ir = v;
		}
	    });
	}
    });

    //$("#reverbList").onchange= setReverbIR()

    $("#delayTimeKnob").knob({
	change : function(v) {
	    setDelayTimeValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Delay"){
		    this.time = v;
		}
	    });
	}
    });

    $("#delayFeedbackKnob").knob({
	change : function(v) {
	    setDelayFeedbackValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Delay"){
		    this.feedback = v;
		}
	    });
	}
    });
    $("#delayWetDryKnob").knob({
	change : function(v) {
	    setDelayWetDryValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Delay"){
		    this.wetDry = v;
		}
	    });
	}
    });

    $("#tremoloRateKnob").knob({
	change : function(v) {
	    setTremoloRateValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Tremolo"){
		    this.rate = v;
		}
	    });
	}
    });

    $("#tremoloDepthKnob").knob({
	change : function(v) {
	    setTremoloDepthValue(activeTrack,v);
	    $.each(effects[activeTrack-1], function(){
		if(this.type == "Tremolo"){
		    this.depth = v;
		}
	    });
	}
    });

    $(".dial").knob();

    $("#playPause").click(function(){
        $('body').trigger('playPause-event');
    });

    $("#stop").click(function(){
        $('body').trigger('stop-event');
    });

    $("#step-backward").click(function(){
        $('body').trigger('stepBackward-event');
    });

    $("#step-forward").click(function(){
        $('body').trigger('stepForward-event');
    });

    $("#zoomIn").click(function(){
        $('body').trigger('zoomIn-event');
	var WavesurferCanvases = $(".sample");
	$.each(WavesurferCanvases,function(){
	    var wavesurferCanvas = this;
	    var oldWidth = wavesurferCanvas.width;
	    var newWidth = oldWidth*2;
	    wavesurferCanvas.width = newWidth;
	    $($(wavesurferCanvas).parent()[0]).css("width",newWidth+"px");
	    var oldLeft = parseInt($($(wavesurferCanvas).parent()[0]).css("left"));
	    $($(wavesurferCanvas).parent()[0]).css("left",""+oldLeft*2+"px");
	});

	$.each(globalWavesurfers, function(){
	    var wavesurfer = this;
	    wavesurfer.drawer.clear();
	    wavesurfer.drawer.width  = wavesurfer.drawer.width*2;
	    wavesurfer.drawer.drawBuffer(wavesurfer.backend.currentBuffer);
	});
    });

    $("#zoomOut").click(function(){
        $('body').trigger('zoomOut-event');
	var WavesurferCanvases = $(".sample");
	$.each(WavesurferCanvases,function(){
	    var wavesurferCanvas = this;
	    var oldWidth = wavesurferCanvas.width;
	    wavesurferCanvas.width = oldWidth/2 + 1;
	    $($(wavesurferCanvas).parent()[0]).css("width",oldWidth/2 + 1+"px");
	    var oldLeft = parseInt($($(wavesurferCanvas).parent()[0]).css("left"));
	    $($(wavesurferCanvas).parent()[0]).css("left",""+oldLeft/2+"px");
	});
	$.each(globalWavesurfers, function(){
	    var wavesurfer = this;
	    wavesurfer.drawer.clear();
	    wavesurfer.drawer.width = wavesurfer.drawer.width/2 + 1;
	    wavesurfer.drawer.drawBuffer(wavesurfer.backend.currentBuffer);
	});
    });

    $("#trackEffectsClose").click(function(){
	$("#trackEffects").css("display","none");
	$("#masterControl").css("display","none");
    });

    $( "#masterVolume" ).slider({
      orientation: "vertical",
      range: "min",
      min: 0,
      max: 100,
      value: 80,
      slide: function( event, ui ) {
	setMasterVolume(ui.value );
      }
    });

});

function createNodes(numTracks) {
    // for each track create a master gain node. specific tracks represented by array index i
    for (var i = 1; i <= numTracks; i++) {
	var trackMasterGainNode = ac.createGain(),
		trackInputNode = ac.createGain(),
		trackVolumeNode = ac.createGain();

	trackMasterGainNode.connect(masterGainNode);
	trackVolumeNode.connect(trackMasterGainNode);
	trackInputNode.connect(trackVolumeNode);

	trackMasterGains[i] = {node: trackMasterGainNode, isMuted: false, isSolo: false};
	trackVolumeGains[i] = trackVolumeNode;
	trackInputNodes[i] = trackInputNode;
    }
}

function startUserMedia(stream) {
    micStream = stream;
}

// Ask user to use microphone on load (Probably should do this at the moment they press record, (If user selects allow, It should then initiate recording, otherwise tell the user they can't record))
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

// Special Debug Console Calls!
win.log = console.log.bind(console);

win.debug = function () {
	var params = Array.prototype.slice.call(arguments, 1);
	params.unshift('%c[%cDEBUG%c] %c' + arguments[0], 'color: black;', 'color: green;', 'color: black;', 'color: blue;');
	console.debug.apply(console, params);
};

win.info = function () {
	var params = Array.prototype.slice.call(arguments, 1);
	params.unshift('[%cINFO%c] ' + arguments[0], 'color: blue;', 'color: black;');
	console.info.apply(console, params);
};

win.warn = function () {
	var params = Array.prototype.slice.call(arguments, 1);
	params.unshift('[%cWARNING%c] ' + arguments[0], 'color: orange;', 'color: black;');
	console.warn.apply(console, params);
};

win.error = function () {
	var params = Array.prototype.slice.call(arguments, 1);
	params.unshift('%c[%cERROR%c] ' + arguments[0], 'color: black;', 'color: red;', 'color: black;');
	console.error.apply(console, params);
};


if (gui.App.fullArgv.indexOf('--reset') !== -1) {

	var data_path = require('nw.gui').App.dataPath;

	localStorage.clear();

	fs.unlinkSync(path.join(data_path, 'data/settings.db'), function (err) {
		if (err) throw err;
	});
	fs.unlinkSync(path.join(data_path, 'data/previous.db'), function (err) {
		if (err) throw err;
	});

}

win.on('resize', function (width, height) {
	localStorage.width = Math.round(width);
	localStorage.height = Math.round(height);
});

win.on('move', function (x, y) {
	localStorage.posX = Math.round(x);
	localStorage.posY = Math.round(y);

});

String.prototype.capitalize = function () {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

String.prototype.capitalizeEach = function () {
	return this.replace(/\w*/g, function (txt) {
		return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
	});
};

String.prototype.endsWith = function (suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

// Shortcuts
Mousetrap.bind(['shift+f12', 'f12', 'command+0'], function (e) {
	win.showDevTools();
});

Mousetrap.bind(['shift+f10', 'f10', 'command+9'], function (e) {
	console.log('Opening: ' + App.settings['tmpLocation']);
	gui.Shell.openItem(App.settings['tmpLocation']);
});

Mousetrap.bind('mod+,', function (e) {
	// Open Settings
	$('#settings').modal('toggle');
});

Mousetrap.bind('up up down down left right left right b a enter', function() {
	console.log("30 Lives Unlocked");
	// Change this before any releases
});

Mousetrap.bind('alt', function() {
	console.log("alt key");
	// When holding alt key, You should be able to switch to maximize. This will feel more native for OS X Uses

});

// Fullscreen for OS X
if (process.platform === 'darwin') {
	Mousetrap.bind('command+ctrl+f', function (e) {
		e.preventDefault();
		win.toggleFullscreen();
		// Toggle button when user enters Fullscreen

		var $this = $(".icon-fullscreen");
		if ($this.hasClass("fa-expand"))
		{
			$this.removeClass("fa-expand").addClass("fa-compress");
			return;
		}

		if ($this.hasClass("fa-compress"))
		{
			$this.removeClass("fa-compress").addClass("fa-expand");
			return;
		}
	});
}

else {
	Mousetrap.bind('ctrl+alt+f', function (e) {
		e.preventDefault();
		win.toggleFullscreen();
		// Toggle button when user enters Fullscreen
        var $this = $(".icon-fullscreen");
        if ($this.hasClass("fa-expand"))
        {
            $this.removeClass("fa-expand").addClass("fa-compress");
            return;
        }
        if ($this.hasClass("fa-compress"))
        {
            $this.removeClass("fa-compress").addClass("fa-expand");
            return;
        }
	});
}

// Drop & Drap Files to open project (Not supported yet)

holder.ondrop = function (e) {
	e.preventDefault();

	for (var i = 0; i < e.dataTransfer.files.length; ++i) {
		console.log(e.dataTransfer.files[i].path);
	}
	return false;
};


// -f argument to open in fullscreen
if (gui.App.fullArgv.indexOf('-f') !== -1) {
	win.enterFullscreen();
}

win.on("devtools-opened", function(url) {
	console.log("devtools-opened: " + url);
	schedStop();
});

// Show 404 page on uncaughtException
process.on('uncaughtException', function (err) {
	window.console.error(err, err.stack);
	// Maybe warn the user with "We've detected an issue, Please wait while we restart the program" and save a backup project so when the user comes back it's ready to continue.
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

	// App Views
	appView.headerBar();
});
