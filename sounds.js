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
//                 rock.track.wetGainNode.gain.value = Math.log(param*(Math.E-1)+1);
				 rock.track.wetGainNode.gain.value = param*0.8 +0.2;
			 },
	invWetGain: function(rock, param) {
				 rock.track.wetGainNode.gain.value = param;
			 },
	sparseSound: function(rock, param) {
		if (param) {
			rock.busySound.dryGainNode.gain.value = 0.0;
			rock.sparseSound.dryGainNode.gain.value = 1.0;
		} else {
			rock.busySound.dryGainNode.gain.value = 1.0;
			rock.sparseSound.dryGainNode.gain.value = 0.0;
		}
	},
	busySound: function(rock, param) {
		if (param) {
			rock.busySound.dryGainNode.gain.value = 1.0;
			rock.sparseSound.dryGainNode.gain.value = 0.0;
		} else {
			rock.busySound.dryGainNode.gain.value = 0.0;
			rock.sparseSound.dryGainNode.gain.value = 1.0;
		}
	},
	justDelay: function(rock, param) {
		if (param) {
			if (!rock.track.justDelayTimer) {
				rock.track.justDelayTimer = setTimeout(function() {
					rock.track.justDelayInGainNode.gain.value = 0.0;
				}, 500);
				rock.track.justDelayNode.delayTime.value = 0.5;
				rock.track.justDelayInGainNode.gain.value = 1.0;
				rock.track.justDelayOutGainNode.gain.value = 1.0;
				rock.track.notJustDelayGainNode.gain.value = 0.0;
			}
		} else {
			if (rock.track.justDelayTimer) {
				clearTimeout(rock.track.justDelayTimer);
				delete rock.track.justDelayTimer;
			}
			rock.track.justDelayOutGainNode.gain.value = 0.0;
			rock.track.notJustDelayGainNode.gain.value = 1.0;
		}
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


		} else {
			muteSound(rock.track);
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

	soundObj.wetGainNode = audioContext.createGainNode();
	soundObj.wetGainNode.gain.value = 1.0;

	soundObj.filterNode = audioContext.createBiquadFilter();
	soundObj.filterNode.type = 1;
	soundObj.filterNode.Q.value = 12;
	soundObj.filterNode.frequency.value = 126;
	soundObj.filterNode.mod = {value:0.2, minValue:0, maxValue:1, name:"mod"};
	soundObj.filterGainNode = audioContext.createGainNode();
	soundObj.filterGainNode.gain.value = 1;

	soundObj.delayNode = audioContext.createDelayNode();
	soundObj.delayNode.delayTime.value = 0.0;

	soundObj.delayGainNode = audioContext.createGainNode();
	soundObj.delayGainNode.gain.value = 0.0;

	soundObj.justDelayNode = audioContext.createDelayNode();
	soundObj.justDelayNode.delayTime = 0.5;
	soundObj.justDelayInGainNode = audioContext.createGainNode();
	soundObj.justDelayInGainNode.gain.value = 1.0;
	soundObj.justDelayOutGainNode = audioContext.createGainNode();
	soundObj.justDelayOutGainNode.gain.value = 0.0;
	soundObj.notJustDelayGainNode = audioContext.createGainNode();
	soundObj.notJustDelayGainNode.gain.value = 1.0;

	soundObj.delayGainNode.connect(soundObj.delayNode);
	soundObj.delayNode.connect(soundObj.delayGainNode);

	soundObj.delayNode.connect(soundObj.justDelayInGainNode);
	soundObj.delayNode.connect(soundObj.notJustDelayGainNode);
	
	soundObj.justDelayInGainNode.connect(soundObj.justDelayNode);
	soundObj.justDelayNode.connect(soundObj.justDelayInGainNode);
	soundObj.justDelayNode.connect(soundObj.justDelayOutGainNode);

	soundObj.justDelayOutGainNode.connect(soundObj.wetGainNode);
	soundObj.notJustDelayGainNode.connect(soundObj.wetGainNode);

	soundObj.filterNode.connect(soundObj.filterGainNode);
	soundObj.filterGainNode.connect(soundObj.delayNode);

	soundObj.wetGainNode.connect(audioContext.destination);

	soundObj.inputNode = soundObj.delayNode;
//    soundObj.inputNode = soundObj.filterNode;

}

function attachSound(soundObj, otherSoundObj) {
	if (soundObj.playing) return;

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
	if (soundObj.playingTimeout) clearTimeout(soundObj.playingTimeout);
	soundObj.noteOff(0);
	soundObj.playing = false;
}

function muteSound(soundObj) {
	soundObj.wetGainNode.gain.value = 0.0;
}

function unMuteSound(soundObj) {
	soundObj.wetGainNode.gain.value = 1.0;
}

function startAllSounds() {
	for (var i in rocks) {
		createFilters(rocks[i].track);
		attachSound(rocks[i].busySound, rocks[i].track);
		attachSound(rocks[i].sparseSound, rocks[i].track);
		muteSound(rocks[i].track);
	}
//    createFilters(drums[0]);
//    attachSound(drums[0], drums[0]);
	setupControls();
}
function stopAllSounds() {
	for (var i in rocks) {
		if (rocks[i].sound)
			stopSound(rocks[i].busySound);
		if (rocks[i].sparseSound)
			stopSound(rocks[i].sparseSound);
	}
//    if (drums[0])
//        stopSound(drums[0]);
}

function loadSounds() {
	audioContext = new webkitAudioContext();
	stopAllSounds();

	var gotten = 0;

	drums = [];
//    drums.push({url:"sounds/drums_heavy.ogg"});
	//drums.push({url:"sounds/behind_the_wall_of_sleep.ogg"});


//    for (var i in drums) {
//        var drum = drums[i];
//        getSound(drum, function(){gotten++; if (gotten == 11) startAllSounds();});
//    }
	
	rocks[0].busySound = {url:"sounds/laurie1.ogg"}
	rocks[1].busySound = {url:"sounds/drums1.ogg"};
	rocks[2].busySound = {url:"sounds/pad1.ogg"};
	rocks[3].busySound = {url:"sounds/plink1.ogg"};
	rocks[4].busySound = {url:"sounds/bass1.ogg"};
//    rocks[0].sparseSound = {url:"sounds/silence.ogg"};
//    rocks[1].sparseSound = {url:"sounds/silence.ogg"};
//    rocks[2].sparseSound = {url:"sounds/silence.ogg"};
//    rocks[3].sparseSound = {url:"sounds/silence.ogg"};
//    rocks[4].sparseSound = {url:"sounds/silence.ogg"};
	rocks[0].sparseSound = {url:"sounds/laurie1.ogg"};
	rocks[1].sparseSound = {url:"sounds/drums1.ogg"};
	rocks[2].sparseSound = {url:"sounds/pad1.ogg"};
	rocks[3].sparseSound = {url:"sounds/plink1.ogg"};
	rocks[4].sparseSound = {url:"sounds/bass1.ogg"};
	for (var i in rocks) {
		var rock = rocks[i];
		rock.track = {};
		getSound(rock.busySound, function(){gotten++; if (gotten == 10) startAllSounds();});
		getSound(rock.sparseSound, function(){gotten++; if (gotten == 10) startAllSounds();});
	}
}
