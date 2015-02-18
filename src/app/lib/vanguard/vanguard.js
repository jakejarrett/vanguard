/*
    Vanguard.js - Essentials of Project Handling
    This will be where all project information (New Project, Open Project, Save Project) is all handled.
*/

var projectState = require('../core/projectstate.js'),
    defaultProject = require('../core/newproject.js'),
    files = require('../core/files.js'),
    ac = new (window.AudioContext || window.webkitAudioContext),
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
    if(effects[trackNumber-1] == null){
        effects[trackNumber-1] = [];
    }

    // $("#volumeSlider"+trackNumber).slider({
    //     value: 80,
    //     orientation: "horizontal",
    //     range: "min",
    //     min: 0,
    //     max: 100,
    //     animate: true,
    //     slide: function( event, ui ) {
    //         var muteTrackNumber = $(this).attr('id').split('volumeSlider')[1];
    //         setTrackVolume(muteTrackNumber, ui.value );
    //     }
    // });

    // $("#selectTrack"+trackNumber).click(function(){
    //     var printTrackNumber = $(this).attr('id').split('selectTrack')[1];
    //     activeTrack = printTrackNumber;
    //     //compensation for off by one (track1 = effects[0])
    //     $(".effect").addClass("hidden");
    //     $.each(effects[activeTrack-1], function(){
    //         var currentEffect = this;
    //         $("#"+currentEffect.type).removeClass("hidden");
    //         if(currentEffect.type == "Compressor"){
    //             $("#compressorThresholdKnob").val(currentEffect.threshold).trigger('change');
    //             $("#compressorRatioKnob").val(currentEffect.ratio).trigger('change');
    //             $("#compressorAttackKnob").val(currentEffect.attack*1000).trigger('change');
    //         }
    //         if(currentEffect.type == "Filter"){
    //             $("#filterCutoffKnob").val(currentEffect.cutoff).trigger('change');
    //             $("#filterQKnob").val(currentEffect.q).trigger('change');
    //             $("#filterTypeKnob").val(currentEffect.filterType).trigger('change');
    //         }
    //         if(currentEffect.type == "Reverb"){
    //             $("#reverbWetDryKnob").val(currentEffect.wetDry);
    //             $("#reverbIrSelectKnob").val(currentEffect.ir);
    //
    //         }
    //         if(currentEffect.type == "Delay"){
    //             $("#delayTimeKnob").val(currentEffect.time);
    //             $("#delayFeedbackKnob").val(currentEffect.feedback);
    //             $("#delayWetDryKnob").val(currentEffect.wetDry);
    //         }
    //         if(currentEffect.type == "Tremelo"){
    //             $("#tremeloRateKnob").val(currentEffect.rate).trigger('change');
    //             $("#tremeloDepthKnob").val(currentEffect.depth).trigger('change');
    //         }
    //     });
    //
    //     Object.keys(effects[activeTrack-1]);
    //
    //     $("#trackEffectsHeader").html("Track "+printTrackNumber);
    //
    //     $("#trackEffects").css("display","block");
    //
    //     $("#masterControl").css("display","block");
    //
    // });
    //

    //
    // $("#solo"+trackNumber).click(function(){
    //     $(this).button('toggle');
    //     var soloTrackNumber = $(this).attr('id').split('solo')[1];
    //     $('body').trigger('solo-event', soloTrackNumber);
    // });
    //
    // $("#record"+trackNumber).click(function(){
    //     var recordTrackNumber = $(this).attr('id').split('record')[1];
    //     $(this).button('toggle');
    //     if($(this).hasClass('active')){
    //         //Start Recording
    //         var input = ac.createMediaStreamSource(micStream);
    //         //input.connect(ac.destination);
    //         activeRecorder = new Recorder(input);
    //         activeRecorder.record();
    //         schedPlay(ac.currentTime);
    //     } else {
    //         //Stop Recording
    //         activeRecorder.stop();
    //
    //         var recordingDuration;
    //
    //         var startBar;
    //         if(pauseBeat==undefined){
    //             startBar = 0;
    //         } else {
    //             startBar = pauseBeat;
    //         }
    //
    //         activeRecorder.getBuffer(function(recordingBuffer){
    //             recordingDuration = recordingBuffer[0].length/ac.sampleRate;
    //
    //             var newBuffer = ac.createBuffer( 2, recordingBuffer[0].length, ac.sampleRate );
    //             //var newSource = ac.createBufferSourceNode();
    //             newBuffer.getChannelData(0).set(recordingBuffer[0]);
    //             newBuffer.getChannelData(1).set(recordingBuffer[1]);
    //             //newSource.buffer = newBuffer;
    //
    //             var span = document.createElement('span');
    //             span.id = "recording" + recordingCount + "Span";
    //             var canvas = document.createElement('canvas');
    //             canvas.className = "sample";
    //             canvas.id = "recording" + recordingCount + "Canvas";
    //             $("#track"+recordTrackNumber).append(span);
    //             $("#recording" + recordingCount + "Span").append(canvas);
    //             $("#recording" + recordingCount + "Span").width(parseFloat(recordingDuration) * ((pixelsPer4*bpm)/60));
    //             $("#recording" + recordingCount + "Span").attr('data-startTime',startBar);
    //             $("#recording" + recordingCount + "Span").css('left',"" + startBar*pixelsPer16 + "px");
    //             $("#recording" + recordingCount + "Span").css('position','absolute');
    //             $("#recording" + recordingCount + "Span").draggable({
    //                 axis: "x",
    //                 containment: "parent",
    //                 grid: [pixelsPer16, 0],		//grid snaps to 16th notes
    //                 stop: function() {
    //                     //get rid of old entry in table
    //                     var currentRecordingCount = parseInt($(this).attr('id').split('recording')[1]);
    //                     var currentStartBar = $(this).attr('data-startTime');
    //                     times[currentStartBar] = jQuery.removeFromArray(currentRecordingCount, times[currentStartBar]);
    //                     $(this).attr('data-startTime',parseInt($(this).css('left'))/pixelsPer16);
    //                     var newStartTime = $(this).attr('data-startTime');
    //                     if(times[newStartTime] == null){
    //                         times[newStartTime] = [{id: currentRecordingCount, track: recordTrackNumber}];
    //                     } else {
    //                         times[newStartTime].push({id: currentRecordingCount, track: recordTrackNumber});
    //                     }
    //                     console.log("Old Start Time: "+ currentStartBar);
    //                     console.log("New Start Time: "+ newStartTime);
    //                 }
    //             });
    //             canvas.width = parseFloat(recordingDuration) * ((pixelsPer4*bpm)/60);
    //             canvas.height = 80;
    //
    //             activeRecorder.exportWAV(function(blob){
    //                 var url = URL.createObjectURL(blob);
    //                 var wavesurfer = Object.create(WaveSurfer);
    //                 wavesurfer.init({
    //                     canvas: canvas,
    //                     waveColor: '#08c',
    //                     progressColor: '#08c',
    //                     loadingColor: 'purple',
    //                     cursorColor: 'navy',
    //                     audioContext: ac
    //                 });
    //                 wavesurfer.load(url);
    //                 globalWavesurfers.push(wavesurfer);
    //                 buffers[recordingCount] = {buffer: newBuffer};
    //
    //                 if(times[startBar] == null){
    //                     times[startBar] = [{id: recordingCount, track: recordTrackNumber}];
    //                 } else {
    //                     times[startBar].push({id: recordingCount, track: recordTrackNumber});
    //                 }
    //                 recordingCount++;
    //             });
    //         });
    //     }
    //
    // });
    //
    // $("#track"+trackNumber+"title").storage({
    //     storageKey : 'track'+trackNumber
    // });
    //
    // $( "#track"+trackNumber ).droppable({
    //     accept: ".librarySample",
    //     drop: function( event, ui ) {
    //         var startBar = Math.floor((ui.offset.left-$(this).offset().left)/6);
    //         var sampleStartTime = startBar;
    //         var rand = parseInt(Math.random() * 10000);
    //         var span = document.createElement('span');
    //         var sampleID = ui.helper.attr("data-id");
    //         var sampleDuration = ui.helper.attr("data-duration");
    //         var sampleURL = ui.helper.attr("data-url");
    //         span.id = "sample" + sampleID + "Span" + rand;
    //         var canvas = document.createElement('canvas');
    //         canvas.className = "sample";
    //         canvas.id = "sample" + sampleID + "Canvas" + rand;
    //         $(this).append(span);
    //         $("#sample" + sampleID + "Span" + rand).append(canvas);
    //         $("#sample" + sampleID + "Span" + rand).width(parseFloat(sampleDuration) * ((pixelsPer4*bpm)/60));
    //         canvas.width = parseFloat(sampleDuration) * ((pixelsPer4*bpm)/60);
    //         canvas.height = 80;
    //         $( "#sample" + sampleID + "Span" + rand).attr('data-startTime',startBar);
    //         $( "#sample" + sampleID + "Span" + rand).css('left',"" + startBar*pixelsPer16 + "px");
    //         $( "#sample" + sampleID + "Span" + rand).css('position','absolute');
    //         $( "#sample" + sampleID + "Span" + rand).draggable({
    //             axis: "x",
    //             containment: "parent",
    //             grid: [pixelsPer16, 0],		//grid snaps to 16th notes
    //             stop: function() {
    //                 var currentStartBar = $(this).attr('data-startTime');
    //                 times[currentStartBar] = jQuery.removeFromArray(sampleID, times[currentStartBar]);
    //                 $(this).attr('data-startTime',parseInt($(this).css('left'))/pixelsPer16);
    //                 var newStartTime = $(this).attr('data-startTime');
    //                 if(times[newStartTime] == null){
    //                     times[newStartTime] = [{id: sampleID, track: trackNumber}];
    //                 } else {
    //                     times[newStartTime].push({id: sampleID, track: trackNumber});
    //                 }
    //             }
    //         });
    //
    //         var wavesurfer = Object.create(WaveSurfer);
    //         wavesurfer.init({
    //             canvas: canvas,
    //             waveColor: 'violet',
    //             progressColor: 'purple',
    //             loadingColor: 'purple',
    //             cursorColor: 'navy',
    //             audioContext: ac
    //         });
    //         wavesurfer.load(sampleURL);
    //         globalWavesurfers.push(wavesurfer);
    //         if(buffers[sampleID]==undefined){
    //             load(sampleURL, sampleID);
    //         }
    //         if(times[sampleStartTime] == null){
    //             times[sampleStartTime] = [{id: sampleID, track: trackNumber}];
    //         } else {
    //             times[sampleStartTime].push({id: sampleID, track: trackNumber});
    //         }
    //     }
    // });

}

// Remove Track
function removeTrack(trackNumber) {
    if (trackNumber > globalNumberOfTracks) {
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
        if( window.document.querySelector('#openfileDialog').value == "" ) {
            // You have opened a project
            projectState.currentState = "openedProject";
            console.log(projectState);
        }
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
        var confirmExit = confirm('Do You wish to close this project?');
        if(confirmExit == true) {
            $( "#newpage" ).show();
            $( "#landingpage" ).show();
            $( "#landingpage-left").show();
            $( "#landingpage-right").show();
            $( "#project" ).hide();
            $( "#bpm" ).hide();
            $( ".projectnav" ).hide();

            // Empty Tracks & trackControls
            vanguard.removeTrack("*");

            projectState.currentState = null;

            console.log(projectState);
        } else {
            return false;
        }
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

    console.log(timelineDIV.length);
}
