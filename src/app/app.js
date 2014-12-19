/*
    App.js - Initialize Application & Gather Resources
*/

// Create AudioContext for entire Application
var ac = new (window.AudioContext || window.webkitAudioContext);
navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia
var masterGainNode = ac.createGain();
masterGainNode.gain.value = .8;
masterGainNode.connect(ac.destination);


var
	// Load native UI library
	gui = require('nw.gui'),

	// browser window object
	win = gui.Window.get(),

	// os object
	os = require('os'),

	// path object
	path = require('path'),

	// fs object
	fs = require('fs'),

	// url object
	url = require('url'),

	// i18n module (translations)
	i18n = require('i18n'),

	// Mime type parsing
	//mime = require('mime'),

	// Moment for Time Parsing
	//moment = require('moment'),

	// Q JS for Promises
	//Q = require('q'),

	// Default Project (New Project defaults)
	defaultproj = require('./lib/core/newproject.js'),

    // Settings
    settings = require('./settings.js'),

    // Create Track
    //createTrack = require('./lib/core/createtrack.js'),

    // Project State
    projectState = require('./lib/core/projectstate.js'),

	// Vanguard JS
	vanguard = require('./lib/vanguard/vanguard.js'),

    // VST Support
    VSTHost = require("node-vst-host").host,

    // Create VST Host
    host = new VSTHost(),

	// New Instance of AudioContext, Only need to create webkit specific code.
	ac = new (window.AudioContext || window.webkitAudioContext),

	// Master Gain
	masterGainNode = ac.createGain();

// Set global Master Volume for entire project
masterGainNode.gain.value = .8;
masterGainNode.connect(ac.destination);

// newProject Info
var NewProject = $.parseJSON(defaultproj.newProject),

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

// File Chooser
function fileChooser(name) {
    var fs = require('fs'),
    	chooser = document.querySelector(name);
    chooser.addEventListener("change", function(evt) {
        console.log(this.value);
        fs.readFile(this.value, 'utf8', function (err,data) {
            if (err) {
                return console.log(err);
            }
            console.log(data);
			//  Handle opening Project here.
        });
    }, false);

    chooser.click();
}

// File Saver
function saveFile(name) {
	// Replace testSave with actual data, This was just to test how to handle the saving function
	// Will probably make it grab all the Project Info on Save so it doesn't try to constantly update an object/json
	var testSave = JSON.stringify(NewProject['projectInfo'], null, 4),
    	fs = require('fs'),
    	saver = document.querySelector(name);
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

// PLayback & Timeline Event Handlers ()
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

    // Create "addChannel()" so i can call this function for a Keyboard shortcut & GUI Shortcut. (And Other shortcuts if added later on)
	// Will probably need to remake the entire process of creating & handling tracks
    function addChannel() {
        var newTrackNumber = globalNumberOfTracks+1;
        globalNumberOfTracks++;
        if(globalNumberOfTracks>4){
            var currentSideBarHeight = parseInt($(".sidebar").css('height'));
            currentSideBarHeight+=90;
            $(".sidebar").css('height',""+currentSideBarHeight+"px");
        }
        createTrack(newTrackNumber);
        var trackMasterGainNode = ac.createGain();
        var trackInputNode = ac.createGain();
        var trackVolumeNode = ac.createGain();
        trackMasterGainNode.connect(masterGainNode);
        trackVolumeNode.connect(trackMasterGainNode);
        trackInputNode.connect(trackVolumeNode);
        trackMasterGains[newTrackNumber] = {node: trackMasterGainNode, isMuted: false, isSolo: false};
        trackVolumeGains[newTrackNumber] = trackVolumeNode;
        trackInputNodes[newTrackNumber] = trackInputNode;
    }

    $("#addTrackButton").click(function(){
        addChannel();
    });

    $( window ).keyup(function (e) {
        var key = window.event? event : e
        if(key.keyCode == 107 && key.ctrlKey)  // New Project
        {
            addChannel();
        }
    });

    drawTimeline();

});

// Create Tracks/Channels
// Really need to create a new way of creating tracks to create a better track handler. (this will be done before an alpha/beta release)
function createTrack(trackNumber) {
    $("#tracks").append("<div id='track"+trackNumber+"' class='span10 track'></div>");
    $("#trackcontrols").append("<div class='row-fluid' id='selectTrack"+trackNumber+"'><div class='span2 trackBox'><p class='trackID ' id='track"+trackNumber+"title'>Track"+trackNumber+"</p><div class='volume-slider' id='volumeSlider"+trackNumber+"'></div><div class='btn-toolbar' style='margin-top: 0px;'><div class='btn-group'><button type='button' class='btn btn-mini' id = 'solo"+trackNumber+"'><i class='fa fa-headphones'></i></button><button type='button' class='btn btn-mini' id = 'mute"+trackNumber+"'><i class='fa fa-volume-off'></i></button><button type='button' class='btn btn-mini' data-toggle='button' id = 'remove"+trackNumber+"'><i class='fa fa-minus'></i></button></div><div class='btn-group'><button type='button' class='btn btn-mini' data-toggle='button' id = 'record"+trackNumber+"'><i class='fa fa-microphone'></i></button></div></div></div></div>");

    $("#volumeSlider"+trackNumber).slider({
	value: 80,
	orientation: "horizontal",
	range: "min",
	min: 0,
	max: 100,
	animate: true,
	slide: function( event, ui ) {
	    var muteTrackNumber = $(this).attr('id').split('volumeSlider')[1];
	    setTrackVolume(muteTrackNumber, ui.value );
	}
    });

	// Select Track/Channel
    $("#selectTrack"+trackNumber).click(function(){
        var printTrackNumber = $(this).attr('id').split('selectTrack')[1];
        activeTrack = printTrackNumber;
        //compensation for off by one (track1 = effects[0])
        $(".effect").addClass("hidden");
        $.each(effects[activeTrack-1], function(){
            var currentEffect = this;
            $("#"+currentEffect.type).removeClass("hidden");
            if(currentEffect.type == "Compressor"){
            $("#compressorThresholdKnob").val(currentEffect.threshold).trigger('change');
            $("#compressorRatioKnob").val(currentEffect.ratio).trigger('change');
            $("#compressorAttackKnob").val(currentEffect.attack*1000).trigger('change');
            }
            if(currentEffect.type == "Filter"){
            $("#filterCutoffKnob").val(currentEffect.cutoff).trigger('change');
            $("#filterQKnob").val(currentEffect.q).trigger('change');
            $("#filterTypeKnob").val(currentEffect.filterType).trigger('change');
            }
            if(currentEffect.type == "Reverb"){
            $("#reverbWetDryKnob").val(currentEffect.wetDry);
            $("#reverbIrSelectKnob").val(currentEffect.ir);

            }
            if(currentEffect.type == "Delay"){
            $("#delayTimeKnob").val(currentEffect.time);
            $("#delayFeedbackKnob").val(currentEffect.feedback);
            $("#delayWetDryKnob").val(currentEffect.wetDry);
            }
            if(currentEffect.type == "Tremelo"){
            $("#tremeloRateKnob").val(currentEffect.rate).trigger('change');
            $("#tremeloDepthKnob").val(currentEffect.depth).trigger('change');
            }
        });

        Object.keys(effects[activeTrack-1]);

        $("#trackEffectsHeader").html("Track "+printTrackNumber);

        $("#trackEffects").css("display","block");

        $("#masterControl").css("display","block");

    });

	// Mute Track/Channel
    $("#mute"+trackNumber).click(function(){
		$(this).button('toggle');
		var muteTrackNumber = $(this).attr('id').split('mute')[1];
		$('body').trigger('mute-event', muteTrackNumber);
    });

	// Remove Track/Channel (would like to move this outside of the createTrack() function)
    $("#remove"+trackNumber).click(function(){
        console.log("removed "+trackNumber);
		// Check if globalNumberOfTracks is higher than this track number
		if(globalNumberOfTracks > trackNumber) {
			// Because globalNumberOfTracks is Higher than this track number, We should change the track ID of the higher Tracks
		}
        $("#track"+trackNumber).remove();
        $("#selectTrack"+trackNumber).remove();
		globalNumberOfTracks--;
		newTrackNumber--;
    });

	// Solo Track/Channel
    $("#solo"+trackNumber).click(function(){
	$(this).button('toggle');
	var soloTrackNumber = $(this).attr('id').split('solo')[1];
	$('body').trigger('solo-event', soloTrackNumber);
    });

	// Record Track/Channel
    $("#record"+trackNumber).click(function(){
		var recordTrackNumber = $(this).attr('id').split('record')[1];
		$(this).button('toggle');
		if($(this).hasClass('active')){
		    //Start Recording
		    var input = ac.createMediaStreamSource(micStream);
		    //input.connect(ac.destination);
		    activeRecorder = new Recorder(input);
		    activeRecorder.record();
		    schedPlay(ac.currentTime);
		} else {
		    //Stop Recording
		    activeRecorder.stop();

		    var recordingDuration;

		    var startBar;
		    if(pauseBeat==undefined){
			startBar = 0;
		    } else {
			startBar = pauseBeat;
		    }

		    activeRecorder.getBuffer(function(recordingBuffer){
			recordingDuration = recordingBuffer[0].length/ac.sampleRate;

			var newBuffer = ac.createBuffer( 2, recordingBuffer[0].length, ac.sampleRate );
			//var newSource = ac.createBufferSourceNode();
			newBuffer.getChannelData(0).set(recordingBuffer[0]);
			newBuffer.getChannelData(1).set(recordingBuffer[1]);
			//newSource.buffer = newBuffer;

			var span = document.createElement('span');
			span.id = "recording" + recordingCount + "Span";
			var canvas = document.createElement('canvas');
			canvas.className = "sample";
			canvas.id = "recording" + recordingCount + "Canvas";
			$("#track"+recordTrackNumber).append(span);
			$("#recording" + recordingCount + "Span").append(canvas);
			$("#recording" + recordingCount + "Span").width(parseFloat(recordingDuration) * ((pixelsPer4*bpm)/60));
			$("#recording" + recordingCount + "Span").attr('data-startTime',startBar);
			$("#recording" + recordingCount + "Span").css('left',"" + startBar*pixelsPer16 + "px");
			$("#recording" + recordingCount + "Span").css('position','absolute');
			$("#recording" + recordingCount + "Span").draggable({
			    axis: "x",
			    containment: "parent",
			    grid: [pixelsPer16, 0],		//grid snaps to 16th notes
			    stop: function() {
				//get rid of old entry in table
				var currentRecordingCount = parseInt($(this).attr('id').split('recording')[1]);
				var currentStartBar = $(this).attr('data-startTime');
				times[currentStartBar] = jQuery.removeFromArray(currentRecordingCount, times[currentStartBar]);
				$(this).attr('data-startTime',parseInt($(this).css('left'))/pixelsPer16);
				var newStartTime = $(this).attr('data-startTime');
				if(times[newStartTime] == null){
				    times[newStartTime] = [{id: currentRecordingCount, track: recordTrackNumber}];
				} else {
				    times[newStartTime].push({id: currentRecordingCount, track: recordTrackNumber});
				}
				console.log("Old Start Time: "+ currentStartBar);
				console.log("New Start Time: "+ newStartTime);
			    }
			});
			canvas.width = parseFloat(recordingDuration) * ((pixelsPer4*bpm)/60);
			canvas.height = 80;

			activeRecorder.exportWAV(function(blob){
			    var url = URL.createObjectURL(blob);
			    var wavesurfer = Object.create(WaveSurfer);
			    wavesurfer.init({
				canvas: canvas,
				waveColor: '#08c',
				progressColor: '#08c',
				loadingColor: 'purple',
				cursorColor: 'navy',
				audioContext: ac
			    });
			    wavesurfer.load(url);
			    globalWavesurfers.push(wavesurfer);
			    buffers[recordingCount] = {buffer: newBuffer};

			    if(times[startBar] == null){
				times[startBar] = [{id: recordingCount, track: recordTrackNumber}];
			    } else {
				times[startBar].push({id: recordingCount, track: recordTrackNumber});
			    }
			    recordingCount++;
			});
		    });



		}

    });

	// Storage API (Maybe remove this as we're able to take advantage of the Users Local Storage Devices)
    $("#track"+trackNumber+"title").storage({
		storageKey : 'track'+trackNumber
    });

	// Track Drop Functionality
    $( "#track"+trackNumber ).droppable({
		accept: ".librarySample",
		drop: function( event, ui ) {
		    var startBar = Math.floor((ui.offset.left-$(this).offset().left)/6);
		    var sampleStartTime = startBar;
		    var rand = parseInt(Math.random() * 10000);
		    var span = document.createElement('span');
		    var sampleID = ui.helper.attr("data-id");
		    var sampleDuration = ui.helper.attr("data-duration");
		    var sampleURL = ui.helper.attr("data-url");
		    span.id = "sample" + sampleID + "Span" + rand;
		    var canvas = document.createElement('canvas');
		    canvas.className = "sample";
		    canvas.id = "sample" + sampleID + "Canvas" + rand;
		    $(this).append(span);
		    $("#sample" + sampleID + "Span" + rand).append(canvas);
		    $("#sample" + sampleID + "Span" + rand).width(parseFloat(sampleDuration) * ((pixelsPer4*bpm)/60));
		    canvas.width = parseFloat(sampleDuration) * ((pixelsPer4*bpm)/60);
		    canvas.height = 80;
		    $( "#sample" + sampleID + "Span" + rand).attr('data-startTime',startBar);
		    $( "#sample" + sampleID + "Span" + rand).css('left',"" + startBar*pixelsPer16 + "px");
		    $( "#sample" + sampleID + "Span" + rand).css('position','absolute');
		    $( "#sample" + sampleID + "Span" + rand).draggable({
			axis: "x",
			containment: "parent",
			grid: [pixelsPer16, 0],		//grid snaps to 16th notes
			stop: function() {
			    var currentStartBar = $(this).attr('data-startTime');
			    times[currentStartBar] = jQuery.removeFromArray(sampleID, times[currentStartBar]);
			    $(this).attr('data-startTime',parseInt($(this).css('left'))/pixelsPer16);
			    var newStartTime = $(this).attr('data-startTime');
			    if(times[newStartTime] == null){
				times[newStartTime] = [{id: sampleID, track: trackNumber}];
			    } else {
				times[newStartTime].push({id: sampleID, track: trackNumber});
			    }
			}
		    });

		    var wavesurfer = Object.create(WaveSurfer);
		    wavesurfer.init({
			canvas: canvas,
			waveColor: 'violet',
			progressColor: 'purple',
			loadingColor: 'purple',
			cursorColor: 'navy',
			audioContext: ac
		    });
		    wavesurfer.load(sampleURL);
		    globalWavesurfers.push(wavesurfer);
		    if(buffers[sampleID]==undefined){
			load(sampleURL, sampleID);
		    }
		    if(times[sampleStartTime] == null){
			times[sampleStartTime] = [{id: sampleID, track: trackNumber}];
		    } else {
			times[sampleStartTime].push({id: sampleID, track: trackNumber});
		    }
		}
    });

	// +1 on trackNumber for everytime we create a new track.
    trackNumber++;
}

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
window.onload = function init() {
    try {
		window.URL = window.URL || window.webkitURL;
	} catch (e) {
		alert('No web audio support in this browser!');
	}

	navigator.webkitGetUserMedia({audio: true}, startUserMedia, function(e) {

	});
};

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
	// App.vent.trigger('about:close');
	// App.vent.trigger('settings:show');
});

Mousetrap.bind('up up down down left right left right b a enter', function() {
	console.log("30 Lives Unlocked");
	// Change this before any releases
});

Mousetrap.bind('alt', function() {
	console.log("alt key");
	// When holding alt key, You should be able to switch to maximize. This will feel more native for OS X Uses

});

Mousetrap.bind('f11', function (e) {
	var spawn = require('child_process').spawn,
		argv = gui.App.fullArgv,
		CWD = process.cwd();

	argv.push(CWD);
	spawn(process.execPath, argv, {
		cwd: CWD,
		detached: true,
		stdio: ['ignore', 'ignore', 'ignore']
	}).unref();
	gui.App.quit();
});

Mousetrap.bind(['?', '/', '\''], function (e) {
	e.preventDefault();
	App.vent.trigger('keyboard:toggle');
});

Mousetrap.bind('shift+up shift+up shift+down shift+down shift+left shift+right shift+left shift+right shift+b shift+a', function () {
	$('body').addClass('knm');
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
