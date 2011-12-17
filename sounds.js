function adjustSoundForRock(rock) {

	if (rock.track) {
		//var mouseXVal = (mousePos.x/window.innerWidth);
		//var freq = rock.velocity.x / rock.maxVelocity;
		if (rock.on && rock.in) {
			var freq = Math.abs(rock.velocity.y) / rock.maxVelocity.y;
			if (freq > 1) freq = 1;
			if (freq < 0) freq = 0;
			//rock.sound.gainNode.gain.value = (1-freq)*0.5+0.5;
			freq *= rock.track.filterNode.mod.value;
			freq += (1-rock.track.filterNode.mod.value);
			rock.track.filterNode.frequency.value = Math.pow(2, freq*10);
		}
		//rock.sound.filterNode.Q.value = rock.underGround ? 20 : -20;

		if (!rock.in) {
			muteSound(rock.track);
		} else if (rock.on && rock.in) {
			console.log("unmuting");
			unMuteSound(rock.track);
			rock.busySound.dryGainNode.gain.value = 1.0;
			rock.sparseSound.dryGainNode.gain.value = 0.0;
		} else {
			console.log("muting");
			unMuteSound(rock.track);
			rock.busySound.dryGainNode.gain.value = 0.0;
			rock.sparseSound.dryGainNode.gain.value = 1.0;
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
		rock.track = {};
		getSound(rock.busySound, function(){gotten++; if (gotten == 11) startAllSounds();});
		getSound(rock.sparseSound, function(){gotten++; if (gotten == 11) startAllSounds();});
	}
}
