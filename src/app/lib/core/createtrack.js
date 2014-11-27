var proj = require('./newproject.js');

/*
var project = JSON.parse(proj.defaultProject);

var tempo = project.projectInfo.bpm;

var numberOfTracks = parseInt(project.projectInfo.tracks)
*/
 /* var processData = function (json) {
    var numberOfTracks = parseInt(json.projectInfo.tracks);
        if(numberOfTracks == null) {
            var numberOfTracks = 4;
        }
	effects = json.projectInfo.effects;
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
	//wavesurfers is array of all tracks
        var wavesurfers = json.samples.map(createWavesurfer);
	$.each(wavesurfers, function(){
	    var currentSample = this;
	    //if they are in workspace...
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
}; */

function createTrack(trackNumber){    
    $("#tracks").append("<div id=\"track"+trackNumber+"\" class=\"span10 track\"></div>");
    $("#trackcontrols").append("<div class=\"row-fluid\" id=\"selectTrack"+trackNumber+"\"><div class=\"span2 trackBox\"><p class=\"trackID \" id=\"track"+trackNumber+"title\">Track"+trackNumber+"</p><div class=\"volume-slider\" id=\"volumeSlider"+trackNumber+"\"></div><div class=\"btn-toolbar\" style=\"margin-top: 0px;\"><div class=\"btn-group\"><button type=\"button\" class=\"btn btn-mini\" id = \"solo"+trackNumber+"\"><i class=\"fa fa-headphones\"></i></button><button type=\"button\" class=\"btn btn-mini\" id = \"mute"+trackNumber+"\"><i class=\"fa fa-volume-off\"></i></button><button type=\"button\" class=\"btn btn-mini\" data-toggle=\"button\" id = \"remove"+trackNumber+"\"><i class=\"fa fa-minus\"></i></button></div><div class=\"btn-group\"><button type=\"button\" class=\"btn btn-mini\" data-toggle=\"button\" id = \"record"+trackNumber+"\"><i class=\"fa fa-microphone\"></i></button></div></div></div></div>");
    if(effects[trackNumber-1] == null){
	   effects[trackNumber-1] = [];
    }
    
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
    
    $("#mute"+trackNumber).click(function(){
	$(this).button('toggle');
	var muteTrackNumber = $(this).attr('id').split('mute')[1];
	$('body').trigger('mute-event', muteTrackNumber);
    });
    
    $("#remove"+trackNumber).click(function(){
        console.log("removed "+trackNumber);
        $("#track"+trackNumber).remove();
        $("#selectTrack"+trackNumber).remove();
    });
    
    $("#solo"+trackNumber).click(function(){
	$(this).button('toggle');
	var soloTrackNumber = $(this).attr('id').split('solo')[1];
	$('body').trigger('solo-event', soloTrackNumber);
    });
    
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
    
    $("#track"+trackNumber+"title").storage({
	storageKey : 'track'+trackNumber
    });
    
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

}

exports.createTrack = createTrack