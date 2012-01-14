var modFuncs = {
	filterFrequency: function(rock, param) {
						 if (rock.track.filterNode.type === 0) { // low pass
							 rock.track.filterGainNode.gain.value = 1-Math.log(param*(Math.E-1)+1);
							 param *= 0.25;//rock.track.filterNode.mod.value;
							 param += 0.7;//(1-rock.track.filterNode.mod.value);
							 rock.track.filterNode.frequency.value = Math.pow(2, param*10);
						 } else {
							 rock.track.filterNode.frequency.value = param * (rock.track.filterNode.frequency.maxValue - rock.track.filterNode.frequency.minValue) + rock.track.filterNode.frequency.minValue;
						 }
					 },

	filterResonance: function(rock, param) {
						 param *= (rock.track.filterNode.Q.maxValue-rock.track.filterNode.Q.minValue);
						 param += rock.track.filterNode.Q.minValue;
						 rock.track.filterNode.Q.value = param;
					 },
	delayFeedback: function(rock, param) {
					   param *= 0.7; // dont want too much
					   param *= (rock.track.delayGainNode.gain.maxValue-rock.track.delayGainNode.gain.minValue);
					   param += rock.track.delayGainNode.gain.minValue;
					   rock.track.delayGainNode.gain.value = param;
				   },
	delayTime: function(rock, param) {
				   param *= (rock.track.delayNode.delayTime.maxValue-rock.track.delayNode.delayTime.minValue);
				   param += rock.track.delayNode.delayTime.minValue;
				   rock.track.delayNode.delayTime.value = param;
			   },
	wetGain: function(rock, param) {
				 rock.track.wetGainNode.gain.value = param;
			 },
	invWetGain: function(rock, param) {
				 rock.track.wetGainNode.gain.value = param;
			 }
};

var paramGetters = {
	velocityY: function(rock) {
				   return Math.abs(rock.velocity.y) / rock.maxVelocity.y;
			   },
	velocityX: function(rock) {
				   return Math.abs(rock.velocity.x) / rock.maxVelocity.y;
			   },
	velocity: function(rock) {
				  return Math.sqrt(rock.velocity.x*rock.velocity.x+rock.velocity.y*rock.velocity.y) / Math.sqrt(rock.maxVelocity.x*rock.maxVelocity.x+rock.maxVelocity.y*rock.maxVelocity.y);
			  },
	positionX: function(rock) {
				   return (rock.x-viewRect.left) / (viewRect.right-viewRect.left);
			   },
	positionY: function(rock) {
				   return (rock.y-viewRect.top) / (viewRect.bottom-viewRect.top);
			   },
	playersRemaining: function(rock) {
						  return 1 - (rocks.length-1) / (numberOfRocks-1);
					  }
};


function adjustSoundForRock(rock) {

	if (rock.track) {
		if (rock.in) {
			unMuteSound(rock.track);

			for (var i in globalMods) {
				var mod = globalMods[i];
				if (mod.func && mod.param) {
					var x = paramGetters[mod.param](rock);
					x = x>1?1:x;
					x = x<0?0:x;
					modFuncs[mod.func](rock, x);
				}
			}


			if (rock.on) {
				rock.busySound.dryGainNode.gain.value = 1.0;
				rock.sparseSound.dryGainNode.gain.value = 0.0;
			} else {
				rock.busySound.dryGainNode.gain.value = 0.0;
				rock.sparseSound.dryGainNode.gain.value = 1.0;
			}
		} else {
			muteSound(rock.track);
		}
	}
}

function getSound(soundObj, success) {
	console.log("get the muther troking sundz!!");
	if (soundObj.isLoaded) return;
	
	var audio = document.getElementById(soundObj.tagId);

	soundObj.data = {data:[], sampleRate:audioDevice.sampleRate, channelCount:2};

	audio.addEventListener('loadedmetadata',
						   function(event) {
							   console.log("loaded metadata");
//                               soundObj.totalBytes = audio.duration * 44100; 
							   soundObj.totalBytes = event.mozFrameBufferLength;
						   },
						   false);

    audio.addEventListener("ended",
						   function() {
							   console.log("audio loaded");
							   soundObj.isLoaded = true;

							   soundObj.data.data = new Float32Array(soundObj.data.data);

							   soundObj.sampler = audioLib.Sampler(audioDevice.sampleRate);

							   // data.data
							   // data.sampleRate
							   // data.channelCount
							   soundObj.sampler.load(soundObj.data);

							   soundObj.sampler.noteOn(440);

							   success();
						   },
						   false);	

	audio.addEventListener('MozAudioAvailable',
						   function(event) {
							   var samples = event.frameBuffer;
							   var time = event.time;

							   for (var i = 0 ; i < samples.length ; i++) {
								   soundObj.data.data.push(samples[i]);
							   }
						   },
						   false);
	audio.muted = true;
	audio.play();

}

function createFilters(soundObj) {

//    soundObj.wetGainNode = audioContext.createGainNode();
//    soundObj.wetGainNode.gain.value = 1.0;

//    soundObj.filterNode = audioContext.createBiquadFilter();
//    soundObj.filterNode.type = 1;
//    soundObj.filterNode.Q.value = 12;
//    soundObj.filterNode.frequency.value = 126;
//    soundObj.filterNode.mod = {value:0.2, minValue:0, maxValue:1, name:"mod"};
//    soundObj.filterGainNode = audioContext.createGainNode();
//    soundObj.filterGainNode.gain.value = 1;

//    soundObj.delayNode = audioContext.createDelayNode();
//    soundObj.delayNode.delayTime.value = 0.0;

//    soundObj.delayGainNode = audioContext.createGainNode();
//    soundObj.delayGainNode.gain.value = 0.0;

//    soundObj.delayGainNode.connect(soundObj.delayNode);
//    soundObj.delayGainNode.connect(soundObj.wetGainNode);
//    soundObj.delayNode.connect(soundObj.delayGainNode);
//    soundObj.filterNode.connect(soundObj.filterGainNode);
//    soundObj.filterGainNode.connect(soundObj.delayNode);
//    soundObj.filterGainNode.connect(soundObj.wetGainNode);
//    soundObj.wetGainNode.connect(audioContext.destination);

//    soundObj.inputNode = soundObj.filterNode;

}

function attachSound(soundObj, otherSoundObj) {
	if (soundObj.playing) return;

//    soundObj.dryGainNode = audioContext.createGainNode();
//    soundObj.dryGainNode.gain.value = 1.0;

//    soundObj.dryGainNode.connect(otherSoundObj.inputNode);

//    soundObj.node = audioContext.createBufferSource();
//    soundObj.node.loop = true;
//    soundObj.node.buffer = soundObj.buffer;
//    soundObj.node.connect(soundObj.dryGainNode);
//    soundObj.node.noteOn(0);

//    soundObj.playing = true;
}

function stopSound(soundObj) {
	if (!soundObj.playing) return;
	if (soundObj.playingTimeout) clearTimeout(soundObj.playingTimeout);
	soundObj.node.noteOff(0);
	soundObj.playing = false;
}

function muteSound(soundObj) {
//    soundObj.wetGainNode.gain.value = 0.0;
}

function unMuteSound(soundObj) {
//    soundObj.wetGainNode.gain.value = 1.0;
}

function startAllSounds() {
//    for (var i in rocks) {
//        createFilters(rocks[i].track);
//        attachSound(rocks[i].busySound, rocks[i].track);
//        attachSound(rocks[i].sparseSound, rocks[i].track);
//        muteSound(rocks[i].track);
//    }
	createFilters(drums[0]);
	attachSound(drums[0], drums[0]);
//    setupControls();
}
function stopAllSounds() {
	for (var i in rocks) {
		if (rocks[i].sound)
			stopSound(rocks[i].busySound);
		if (rocks[i].sparseSound)
			stopSound(rocks[i].sparseSound);
	}
	if (drums[0])
		stopSound(drums[0]);
}

function audioCallback(buffer, channelCount) {
	for (var d in drums) {
		if (drums[d].sampler) {
			drums[d].sampler.append(buffer, channelCount);
		}
	}

}

function loadSounds() {
//    audioContext = new webkitAudioContext();
	audioDevice = audioLib.AudioDevice(audioCallback, 2);
	stopAllSounds();

	var gotten = 0;

	drums = [];
	drums.push({tagId:"drums_heavy"});
	//drums.push({url:"sounds/behind_the_wall_of_sleep.ogg"});


	for (var i in drums) {
		var drum = drums[i];
		getSound(drum, function(){if (++gotten === 1) startAllSounds();});
	}
	
//    rocks[0].busySound = {url:"sounds/track1_heavy.ogg"};
//    rocks[1].busySound = {url:"sounds/track2_heavy.ogg"};
//    rocks[2].busySound = {url:"sounds/track3_heavy.ogg"};
//    rocks[3].busySound = {url:"sounds/track4_heavy.ogg"};
//    rocks[4].busySound = {url:"sounds/track5_heavy.ogg"};
//    rocks[0].sparseSound = {url:"sounds/track1_sparse.ogg"};
//    rocks[1].sparseSound = {url:"sounds/track2_sparse.ogg"};
//    rocks[2].sparseSound = {url:"sounds/track3_sparse.ogg"};
//    rocks[3].sparseSound = {url:"sounds/track4_sparse.ogg"};
//    rocks[4].sparseSound = {url:"sounds/track5_sparse.ogg"};
//    for (var i in rocks) {
//        var rock = rocks[i];
//        rock.track = {};
//        getSound(rock.busySound, function(){gotten++; if (gotten == 11) startAllSounds();});
//        getSound(rock.sparseSound, function(){gotten++; if (gotten == 11) startAllSounds();});
//    }
}
