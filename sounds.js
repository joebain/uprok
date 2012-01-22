var modFuncs = {
	filterFrequency: function(rock, param) {
						 if (rock.track.filterNode.type === 0) { // low pass
//                             rock.track.filterGainNode.gain.value = 1-Math.log(param*(Math.E-1)+1);
							 param *= 0.25;//rock.track.filterNode.mod.value;
							 if (rock.magicFilterNumber) {
								 param += rock.magicFilterNumber;
							 } else {
								 param += 0.8;//(1-rock.track.filterNode.mod.value);
							 }
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
	filterOn: function(rock, param) {
//        param = param>0 ? 1 : 0;
		rock.track.filterGainNode.gain.value = param;
		rock.track.notFilterGainNode.gain.value = 1.0-param;
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
	delayOn: function(rock, param) {
//        param = param >0 ?1:0;
		rock.track.delayOutGainNode.gain.value = param;
//        rock.track.notDelayGainNode.gain.value = 1-param;
	},
	wetGain: function(rock, param) {
//                    rock.track.wetGainNode.gain.value = param;
					rock.track.wetGainNode.gain.linearRampToValueAtTime(param,audioContext.currentTime);
			 },
	invWetGain: function(rock, param) {
				 rock.track.wetGainNode.gain.value = param;
			 },
	justDelay: function(rock, param) {
		if (param) {
			if (!rock.track.justDelayNode.timer) {
				rock.track.justDelayNode.timer = setTimeout(function() {
					rock.track.justDelayOutGainNode.gain.value = 0.0;
					rock.track.justDelayInGainNode.gain.value = 1.0;
					rock.track.notJustDelayGainNode.gain.value = 1.0;
					rock.track.justDelayFeedbackGainNode.gain.value = 0.0;
					delete rock.track.justDelayNode.timer;
				}, 400);
			}
			rock.track.justDelayNode.delayTime.value = 0.2;
			rock.track.justDelayInGainNode.gain.value = 0.0;
			rock.track.justDelayOutGainNode.gain.value = 1.0;
			rock.track.notJustDelayGainNode.gain.value = 0.0;
			rock.track.justDelayFeedbackGainNode.gain.value = 1.0;
		} else {
			if (!rock.track.justDelayNode.timer) {
				rock.track.justDelayOutGainNode.gain.value = 0.0;
				rock.track.justDelayInGainNode.gain.value = 1.0;
				rock.track.notJustDelayGainNode.gain.value = 1.0;
				rock.track.justDelayFeedbackGainNode.gain.value = 0.0;
			}
		}
	}
};

var paramGetters = {
	velocityY: function(rock) {
				   return Math.abs(rock.velocity.y / rock.maxVelocity.y);
			   },
	velocityX: function(rock) {
				   return Math.abs(rock.velocity.x) / rock.maxVelocity.y;
			   },
	velocity: function(rock) {
				  return Math.sqrt(rock.velocity.x*rock.velocity.x+rock.velocity.y*rock.velocity.y) / Math.sqrt(rock.maxVelocity.x*rock.maxVelocity.x+rock.maxVelocity.y*rock.maxVelocity.y);
			  },
	positionX: function(rock) {
				   return (rock.x-actualViewRect.left) / (actualViewRect.right-actualViewRect.left);
			   },
	positionY: function(rock) {
				   return (rock.y-actualViewRect.top) / (actualViewRect.bottom-actualViewRect.top);
			   },
	playersRemaining: function(rock) {
						  return 1 - (rocks.length-1) / (numberOfRocks-1);
					  },
	rockOn: function(rock) {
		return rock.on?1:0;
	},
	rockUnderGround: function(rock) {
		return rock.underGround?1:0;
	},
	rockAboveGroundAndOn: function(rock) {
		return (!rock.underGround && rock.on) ? 1 :0;
	}
};


function adjustSoundForRock(rock) {

	if (rock.track) {
		if (rock.in) {
//            if (rock.track.wetGainNode.gain.value <= 0) {
//                console.log("unmuting");
//                unMuteSound(rock.track);
//            }
//            rock.track.wetGainNode.gain.value = 0.0;
			for (var i in globalMods) {
				var mod = globalMods[i];
				if (mod.func && mod.param) {
					var x = paramGetters[mod.param](rock);
					x = x>1?1:x;
					x = x<0?0:x;
					modFuncs[mod.func](rock, x);
				}
			}


		} else {
//            muteSound(rock.track);
		}
	}
}


function getSound(soundObj, success) {
	if (soundObj.isLoaded) return;
	var request = new XMLHttpRequest();
	request.open("GET", soundObj.url, true);
	request.responseType = "arraybuffer";
	request.onload = function() {
		soundObj.buffer = audioContext.createBuffer(request.response, false);
		soundObj.isLoaded = true;
		success();
	};
	request.send();
}

function createFilters(soundObj) {

	soundObj.dryGainNode = audioContext.createGainNode();
	soundObj.dryGainNode.gain.value = 1.0;

	soundObj.wetGainNode = audioContext.createGainNode();
	soundObj.wetGainNode.gain.value = 0.0;

	soundObj.filterNode = audioContext.createBiquadFilter();
	soundObj.filterNode.type = 1;
	soundObj.filterNode.Q.value = 12;
	soundObj.filterNode.frequency.value = 126;
	soundObj.filterNode.mod = {value:0.2, minValue:0, maxValue:1, name:"mod"};
	soundObj.filterGainNode = audioContext.createGainNode();
	soundObj.filterGainNode.gain.value = 0.0;
	soundObj.notFilterGainNode = audioContext.createGainNode();
	soundObj.notFilterGainNode.gain.value = 1.0;

	soundObj.reverbNode = audioContext.createConvolver();
//    soundObj.reverbNode.buffer = ;
	soundObj.reverbGainNode = audioContext.createGainNode();
	soundObj.reverbGainNode.gain.value = 0.0;
	soundObj.notReverbGainNode = audioContext.createGainNode();
	soundObj.notReverbGainNode.gain.value = 1.0;

	soundObj.delayNode = audioContext.createDelayNode();
	soundObj.delayNode.delayTime.value = 0.0;
	soundObj.delayGainNode = audioContext.createGainNode();
	soundObj.delayGainNode.gain.value = 0.0;
	soundObj.delayOutGainNode = audioContext.createGainNode();
	soundObj.delayOutGainNode.gain.value = 0.0;
	soundObj.notDelayGainNode = audioContext.createGainNode();
	soundObj.notDelayGainNode.gain.value = 1.0;

	soundObj.justDelayNode = audioContext.createDelayNode();
	soundObj.justDelayNode.delayTime = 0.5;
	soundObj.justDelayInGainNode = audioContext.createGainNode();
	soundObj.justDelayInGainNode.gain.value = 1.0;
	soundObj.justDelayFeedbackGainNode = audioContext.createGainNode();
	soundObj.justDelayFeedbackGainNode.gain.value = 0.0;
	soundObj.justDelayOutGainNode = audioContext.createGainNode();
	soundObj.justDelayOutGainNode.gain.value = 0.0;
	soundObj.notJustDelayGainNode = audioContext.createGainNode();
	soundObj.notJustDelayGainNode.gain.value = 1.0;


	// set up the individual effect routings
	//set up the hard delay
	soundObj.justDelayInGainNode.connect(soundObj.justDelayNode);
	soundObj.justDelayNode.connect(soundObj.justDelayFeedbackGainNode);
	soundObj.justDelayFeedbackGainNode.connect(soundObj.justDelayNode);
	soundObj.justDelayNode.connect(soundObj.justDelayOutGainNode);
	
	//set up the soft delay
	soundObj.delayGainNode.connect(soundObj.delayNode);
	soundObj.delayNode.connect(soundObj.delayGainNode);
	soundObj.delayNode.connect(soundObj.delayOutGainNode);

	//set up the filter
	soundObj.filterNode.connect(soundObj.filterGainNode);

	// set up the routings for the whole graph
	
	// start at the dry gain
	soundObj.inputNode = soundObj.dryGainNode;

	// first the hard delay
	soundObj.dryGainNode.connect(soundObj.justDelayInGainNode);
	soundObj.dryGainNode.connect(soundObj.notJustDelayGainNode);

	// the hard delay goes to the soft delay
	soundObj.justDelayOutGainNode.connect(soundObj.delayNode);
	soundObj.notJustDelayGainNode.connect(soundObj.delayNode);
	soundObj.justDelayOutGainNode.connect(soundObj.notDelayGainNode);
	soundObj.notJustDelayGainNode.connect(soundObj.notDelayGainNode);

	// the soft delay goes to the reverb
	soundObj.delayOutGainNode.connect(soundObj.reverbNode);
	soundObj.delayOutGainNode.connect(soundObj.notReverbGainNode);
	soundObj.notDelayGainNode.connect(soundObj.reverbNode);
	soundObj.notDelayGainNode.connect(soundObj.notReverbGainNode);

	// the reverb goed to the filter
	soundObj.reverbGainNode.connect(soundObj.notFilterGainNode);
	soundObj.reverbGainNode.connect(soundObj.filterNode);
	soundObj.notReverbGainNode.connect(soundObj.notFilterGainNode);
	soundObj.notReverbGainNode.connect(soundObj.filterNode);

	// the filter goes to the final wet gain
	soundObj.notFilterGainNode.connect(soundObj.wetGainNode);
	soundObj.filterGainNode.connect(soundObj.wetGainNode);

	// the wet gain goes out
	soundObj.wetGainNode.connect(audioContext.destination);
}

function attachSound(soundObj, otherSoundObj) {
	soundObj.dryGainNode = audioContext.createGainNode();
	soundObj.dryGainNode.gain.value = 1.0;

	soundObj.dryGainNode.connect(otherSoundObj.inputNode);

	soundObj.node = audioContext.createBufferSource();
	soundObj.node.loop = true;
	soundObj.node.buffer = soundObj.buffer;
	soundObj.node.connect(soundObj.dryGainNode);
	soundObj.node.noteOn(0);

	soundObj.playing = true;
}

function stopSound(soundObj) {
	if (!soundObj.playing) return;
	soundObj.node.noteOff(0);
	soundObj.playing = false;
}

function muteSound(soundObj, time) {
	console.log("mute sound");
	if (time === undefined) time = 2;
	if (soundObj.wetGainNode) {
		soundObj.wetGainNode.gain.linearRampToValueAtTime(soundObj.wetGainNode.gain.value,audioContext.currentTime);
		soundObj.wetGainNode.gain.linearRampToValueAtTime(0,audioContext.currentTime+time);
	}
}

function unMuteSound(soundObj, time) {
	if (time === undefined) time = 2;
	if (soundObj.wetGainNode) {
			soundObj.wetGainNode.gain.linearRampToValueAtTime(soundObj.wetGainNode.gain.value,audioContext.currentTime);
			soundObj.wetGainNode.gain.linearRampToValueAtTime(1.0,audioContext.currentTime+time);
	}
}

function startAllSounds() {
	for (var i in rocks) {
		createFilters(rocks[i].track);
		attachSound(rocks[i].startSound, rocks[i].track);
		attachSound(rocks[i].midSound, rocks[i].track);
		muteSound(rocks[i].track, 0);
	}
	loopSounds();
	setupControls();
}
function stopAllSounds() {
	for (var i in rocks) {
		if (rocks[i].startSound)
			stopSound(rocks[i].startSound);
		if (rocks[i].midSound)
			stopSound(rocks[i].midSound);
	}
}

var loopTimeout;
function loopSounds() {
	console.log("rocks in " + rocks.length);
	for (var r = 0 ; r < rocks.length; r++) {
		if (rocks.length > 3) {
			rocks[r].startSound.dryGainNode.gain.linearRampToValueAtTime(1,audioContext.currentTime);
			rocks[r].midSound.dryGainNode.gain.linearRampToValueAtTime(0,audioContext.currentTime);
		} else {
			rocks[r].startSound.dryGainNode.gain.linearRampToValueAtTime(rocks[r].startSound.dryGainNode.gain.value,audioContext.currentTime);
			rocks[r].startSound.dryGainNode.gain.linearRampToValueAtTime(0,audioContext.currentTime+1.0);

			rocks[r].midSound.dryGainNode.gain.linearRampToValueAtTime(rocks[r].midSound.dryGainNode.gain.value,audioContext.currentTime);
			rocks[r].midSound.dryGainNode.gain.linearRampToValueAtTime(1,audioContext.currentTime+1.0);
		}
	}
	loopTimeout = setTimeout(loopSounds,(rocks[0].startSound.buffer.duration)*1000); 
}

function loadSounds() {
	audioContext = new webkitAudioContext();
	stopAllSounds();

	var gotten = 0;

	rocks[0].startSound = {url:"sounds/laurie_start.ogg"}
	rocks[1].startSound = {url:"sounds/drums_start.ogg"};
	rocks[2].startSound = {url:"sounds/adrums_start.ogg"};
	rocks[3].startSound = {url:"sounds/plink_start.ogg"};
	rocks[4].startSound = {url:"sounds/bass_start.ogg"};
	rocks[0].midSound = {url:"sounds/laurie_mid.ogg"}
	rocks[1].midSound = {url:"sounds/drums_mid.ogg"};
	rocks[2].midSound = {url:"sounds/adrums_mid.ogg"};
	rocks[3].midSound = {url:"sounds/plink_mid.ogg"};
	rocks[4].midSound = {url:"sounds/bass_mid.ogg"};
	for (var i in rocks) {
		var rock = rocks[i];
		rock.track = {};
		getSound(rock.startSound, function(){gotten++; if (gotten == 10) startAllSounds();});
		getSound(rock.midSound, function(){gotten++; if (gotten == 10) startAllSounds();});
	}
}
