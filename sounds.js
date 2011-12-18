var modFuncs = {
	filterFrequency: function(rock, param) {
						 param *= 0.25;//rock.track.filterNode.mod.value;
						 param += 0.7;//(1-rock.track.filterNode.mod.value);
						 rock.track.filterNode.frequency.value = Math.pow(2, param*10);
					 },

	filterResonance: function(rock, param) {
						 param *= (rock.track.filterNode.Q.maxValue-rock.track.filterNode.Q.minValue);
						 param += rock.track.filterNode.Q.minValue;
						 rock.track.filterNode.Q.value = param;
					 },
	delayFeedback: function(rock, param) {
						 param *= (rock.track.delayGainNode.gain.maxValue-rock.track.delayGainNode.gain.minValue);
						 param += rock.track.delayGainNode.gain.minValue;
						 rock.track.delayGainNode.gain.value = param;
					 },
	delayTime: function(rock, param) {
						 param *= (rock.track.delayNode.delayTime.maxValue-rock.track.delayNode.delayTime.minValue);
						 param += rock.track.delayNode.delayTime.minValue;
						 rock.track.delayNode.delayTime.value = param;
					 }
};

var paramGetters = {
	velocityY: function(rock) {
				   return Math.abs(rock.velocity.y) / 5;// rock.maxVelocity.y;
			   },
	velocityX: function(rock) {
				   return Math.abs(rock.velocity.x) / 2;// rock.maxVelocity.y;
			   },
	velocity: function(rock) {
				   return Math.sqrt(rock.velocity.x*rock.velocity.x+rock.velocity.y*rock.velocity.y) / 4;
			   },
	positionX: function(rock) {
				   return (rock.x-viewRect.left) / (viewRect.right-viewRect.left);
			   },
	positionY: function(rock) {
				   return (rock.y-viewRect.top) / (viewRect.bottom-viewRect.top);
			   }
};


function adjustSoundForRock(rock) {

	if (rock.track) {
		if (rock.in) {
			unMuteSound(rock.track);

			for (var i in rock.track.mods) {
				var mod = rock.track.mods[i];
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
	soundObj.filterNode.type = 0;
	soundObj.filterNode.Q.value = 12;
	soundObj.filterNode.frequency.value = 126;
	soundObj.filterNode.mod = {value:0.2, minValue:0, maxValue:1, name:"mod"};

	soundObj.delayNode = audioContext.createDelayNode();
	soundObj.delayNode.delayTime.value = 0.1;

	soundObj.delayGainNode = audioContext.createGainNode();
	soundObj.delayGainNode.gain.value = 0.5;

	soundObj.delayGainNode.connect(soundObj.delayNode);
	soundObj.delayGainNode.connect(soundObj.wetGainNode);
	soundObj.delayNode.connect(soundObj.delayGainNode);
	soundObj.filterNode.connect(soundObj.delayNode);
	soundObj.wetGainNode.connect(audioContext.destination);

	soundObj.inputNode = soundObj.filterNode;

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
	soundObj.node.noteOff(0);
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
	createFilters(drums[0]);
	attachSound(drums[0], drums[0]);
	setupControls();
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

function loadSounds() {
	audioContext = new webkitAudioContext();
	stopAllSounds();

	var gotten = 0;

	drums = [];
	drums.push({url:"sounds/drums_heavy.ogg"});
	//drums.push({url:"sounds/behind_the_wall_of_sleep.ogg"});


	for (var i in drums) {
		var drum = drums[i];
		getSound(drum, function(){gotten++; if (gotten == 11) startAllSounds();});
	}
	
	rocks[0].busySound = {url:"sounds/track1_heavy.ogg"};
	rocks[1].busySound = {url:"sounds/track2_heavy.ogg"};
	rocks[2].busySound = {url:"sounds/track3_heavy.ogg"};
	rocks[3].busySound = {url:"sounds/track4_heavy.ogg"};
	rocks[4].busySound = {url:"sounds/track5_heavy.ogg"};
	rocks[0].sparseSound = {url:"sounds/track1_sparse.ogg"};
	rocks[1].sparseSound = {url:"sounds/track2_sparse.ogg"};
	rocks[2].sparseSound = {url:"sounds/track3_sparse.ogg"};
	rocks[3].sparseSound = {url:"sounds/track4_sparse.ogg"};
	rocks[4].sparseSound = {url:"sounds/track5_sparse.ogg"};
	for (var i in rocks) {
		var rock = rocks[i];
		rock.track = {mods:[{func:"filterFrequency", param:"velocityY"}]};
		getSound(rock.busySound, function(){gotten++; if (gotten == 11) startAllSounds();});
		getSound(rock.sparseSound, function(){gotten++; if (gotten == 11) startAllSounds();});
	}
}
