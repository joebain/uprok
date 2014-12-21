var FREQUENCY_MAX_VALUE = 20000;
var FREQUENCY_MIN_VALUE = 10;
var Q_MAX_VALUE = 1000;
var Q_MIN_VALUE = 0.0001;
var GAIN_MIN_VALUE = -40;
var GAIN_MAX_VALUE = 40;
var DELAY_MIN_VALUE = 0;
var DELAY_MAX_VALUE = 5;

function nodeStart(node, value) {
    if (node.start) {
        node.start(value);
    } else if (node.noteOn) {
        node.noteOn(value);
    }
}

function nodeStop(node, value) {
    if (node.stop) {
        node.stop(value);
    } else if (node.noteOff) {
        node.noteOff(value);
    }
}

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
							 rock.track.filterNode.frequency.value = param * (FREQUENCY_MAX_VALUE - FREQUENCY_MIN_VALUE) + FREQUENCY_MIN_VALUE;
						 }
					 },

	filterResonance: function(rock, param) {
						 param *= (Q_MAX_VALUE-Q_MIN_VALUE);
						 param += Q_MIN_VALUE;
						 rock.track.filterNode.Q.value = param;
					 },
	filterOn: function(rock, param) {
//        param = param>0 ? 1 : 0;
		rock.track.filterGainNode.gain.value = param;
		rock.track.notFilterGainNode.gain.value = 1.0-param;
	},
	delayFeedback: function(rock, param) {
					   param *= 0.7; // dont want too much
					   param *= (GAIN_MAX_VALUE-GAIN_MIN_VALUE);
					   param += GAIN_MIN_VALUE;
					   rock.track.delayGainNode.gain.value = param;
				   },
	delayTime: function(rock, param) {
				   param *= (DELAY_MAX_VALUE-DELAY_MIN_VALUE);
				   param += DELAY_MIN_VALUE;
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
					rock.track.justDelayNode.delayTime.value = 0.2;
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
				rock.track.justDelayNode.delayTime.value = 0.2;
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
				if (rocks.length > 1) {
					return (rock.x-actualViewRect.left) / (actualViewRect.right-actualViewRect.left);
				} else {
					return 1;
				}
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

var dlTimeout = 1000;
function getSoundAndSave(soundObj, success) {
	if (soundObj.isLoaded) return;
	setTimeout(function() {
		var request = new XMLHttpRequest();
		request.open("GET", soundObj.url, true);
		request.responseType = "arraybuffer";
		request.onload = function() {
			var name = soundObj.url.replace("sounds/","");
			name = name.replace(".ogg", "");
			var arr = new Uint8Array(request.response);
			var str = "var " + name + " = [" + Array.prototype.join.call(arr, ",") + "];";
			var uriContent = "data:application/octet-stream," + encodeURIComponent(str);
			var newWindow = window.open(uriContent, 'neuesDokument');
            audioContext.decodeAudioData(request.response, function(data) {
                soundObj.buffer = data;
                soundObj.isLoaded = true;
                success();
            });
		};
		request.send();
	}, dlTimeout);
	dlTimeout += 1000;
}

function getSoundFromArray(soundObj, success) {
	if (!soundObj) return;
	if (soundObjs[soundObj.url]) {
		var oldSoundObj = soundObjs[soundObj.url];
		for (var s in oldSoundObj) {
			soundObj[s] = oldSoundObj[s];
		}
		success();
		return;
	}
	var sourceBuffer = new Uint8Array(soundObj.sourceArray).buffer;
    audioContext.decodeAudioData(sourceBuffer, function(data) {
        soundObj.buffer = data;
        soundObj.isLoaded = true;
        success();
    });
	soundObjs[soundObj.url] = soundObj;
}

var soundObjs = [];
function getSound(soundObj, success) {
	if (soundObj.isLoaded) return;
	setTimeout(function() {
		var request = new XMLHttpRequest();
		request.open("GET", soundObj.url, true);
		request.responseType = "arraybuffer";
		request.onload = function() {
            audioContext.decodeAudioData(request.response, function(data) {
                soundObj.buffer = data;
                soundObj.isLoaded = true;
                success();
            });
		};
		request.send();
	}, dlTimeout);
	dlTimeout += 1000;
}

function createGain() {
    if (audioContext.createGain) {
        return audioContext.createGain();
    } else if (audioContext.createGainNode) {
        return audioContext.createGainNode();
    }
}

function createDelay() {
    if (audioContext.createDelay) {
        return audioContext.createDelay();
    } else if (audioContext.createDelayNode) {
        return audioContext.createDelayNode();
    }
}

function createFilters(soundObj) {

	soundObj.dryGainNode = createGain();
	soundObj.dryGainNode.gain.value = 1.0;

	soundObj.wetGainNode = createGain();
	soundObj.wetGainNode.gain.value = 0.0;

	soundObj.filterNode = audioContext.createBiquadFilter();
	soundObj.filterNode.type = 1;
	soundObj.filterNode.Q.value = 12;
	soundObj.filterNode.frequency.value = 126;
	soundObj.filterNode.mod = {value:0.2, minValue:0, maxValue:1, name:"mod"};
	soundObj.filterGainNode = createGain();
	soundObj.filterGainNode.gain.value = 0.0;
	soundObj.notFilterGainNode = createGain();
	soundObj.notFilterGainNode.gain.value = 1.0;

	soundObj.reverbNode = audioContext.createConvolver();
//    soundObj.reverbNode.buffer = ;
	soundObj.reverbGainNode = createGain();
	soundObj.reverbGainNode.gain.value = 0.0;
	soundObj.notReverbGainNode = createGain();
	soundObj.notReverbGainNode.gain.value = 1.0;

	soundObj.delayNode = createDelay(DELAY_MAX_VALUE);
	soundObj.delayNode.delayTime.value = 0.0;
	soundObj.delayGainNode = createGain();
	soundObj.delayGainNode.gain.value = 0.0;
	soundObj.delayOutGainNode = createGain();
	soundObj.delayOutGainNode.gain.value = 0.0;
	soundObj.notDelayGainNode = createGain();
	soundObj.notDelayGainNode.gain.value = 1.0;

	soundObj.justDelayNode = createDelay(DELAY_MAX_VALUE);
	soundObj.justDelayNode.delayTime = 0.5;
	soundObj.justDelayInGainNode = createGain();
	soundObj.justDelayInGainNode.gain.value = 1.0;
	soundObj.justDelayFeedbackGainNode = createGain();
	soundObj.justDelayFeedbackGainNode.gain.value = 0.0;
	soundObj.justDelayOutGainNode = createGain();
	soundObj.justDelayOutGainNode.gain.value = 0.0;
	soundObj.notJustDelayGainNode = createGain();
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
//    soundObj.delayOutGainNode.connect(soundObj.reverbNode);
//    soundObj.delayOutGainNode.connect(soundObj.notReverbGainNode);
//    soundObj.notDelayGainNode.connect(soundObj.reverbNode);
//    soundObj.notDelayGainNode.connect(soundObj.notReverbGainNode);

	// the reverb goed to the filter
//    soundObj.reverbGainNode.connect(soundObj.notFilterGainNode);
//    soundObj.reverbGainNode.connect(soundObj.filterNode);
//    soundObj.notReverbGainNode.connect(soundObj.notFilterGainNode);
//    soundObj.notReverbGainNode.connect(soundObj.filterNode);
	soundObj.delayOutGainNode.connect(soundObj.notFilterGainNode);
	soundObj.delayOutGainNode.connect(soundObj.filterNode);
	soundObj.notDelayGainNode.connect(soundObj.notFilterGainNode);
	soundObj.notDelayGainNode.connect(soundObj.filterNode);

	// the filter goes to the final wet gain
	soundObj.notFilterGainNode.connect(soundObj.wetGainNode);
	soundObj.filterGainNode.connect(soundObj.wetGainNode);

	// the wet gain goes out
	soundObj.wetGainNode.connect(audioContext.destination);
}

function attachSound(soundObj, otherSoundObj) {
	soundObj.dryGainNode = createGain();
	soundObj.dryGainNode.gain.value = 1.0;

	soundObj.dryGainNode.connect(otherSoundObj.inputNode);

	soundObj.node = audioContext.createBufferSource();
	soundObj.node.loop = true;
	soundObj.node.buffer = soundObj.buffer;
	soundObj.node.connect(soundObj.dryGainNode);
	nodeStart(soundObj.node, 0);

	soundObj.playing = true;
}

function stopSound(soundObj) {
	muteSound(soundObj, 0);
	return;
//    if (!soundObj.playing) return;
	nodeStop(soundObj.node, 0);
	soundObj.playing = false;
}

function muteAllSounds(oldRocks, time) {
	var rocks = rocks;
	if (oldRocks) {
		rocks = oldRocks;
	}
	for (var i in rocks) {
		if (!rocks[i]) continue;
        if (!rocks[i].track) continue;
		if (time === undefined) time = 2;

		if (rocks[i].track.wetGainNode) {
			rocks[i].track.wetGainNode.gain.linearRampToValueAtTime(rocks[i].track.wetGainNode.gain.value,audioContext.currentTime);
			rocks[i].track.wetGainNode.gain.linearRampToValueAtTime(0,audioContext.currentTime+time);
		}
	}
}

function muteSound(soundObj, time) {
	console.log("mute sound");
	if (time === undefined) time = 2;
    if (soundObj === undefined) return;
	if (soundObj.wetGainNode) {
		if (soundObj.wetGainNode.gain.value !== 0) {
			soundObj.wetGainNode.gain.linearRampToValueAtTime(soundObj.wetGainNode.gain.value,audioContext.currentTime);
			soundObj.wetGainNode.gain.linearRampToValueAtTime(0,audioContext.currentTime+time);
		}
	}
}

function unMuteSound(soundObj, time) {
	if (time === undefined) time = 2;
	if (soundObj.wetGainNode) {
		if (soundObj.wetGainNode.gain.value !== 0) {
			soundObj.wetGainNode.gain.linearRampToValueAtTime(soundObj.wetGainNode.gain.value,audioContext.currentTime);
			soundObj.wetGainNode.gain.linearRampToValueAtTime(1.0,audioContext.currentTime+time);
		}
	}
}

var startedSounds = false;
function startAllSounds() {
	stopAllSounds();
	if (startedSounds) {
		return;
	}
	startedSounds = true;
	for (var i in rocks) {
		if (rocks[i].originalNumber === 5) continue;
		createFilters(rocks[i].track);
		attachSound(rocks[i].startSound, rocks[i].track);
		attachSound(rocks[i].midSound, rocks[i].track);
		attachSound(rocks[i].endSound, rocks[i].track);
		muteSound(rocks[i].track, 0);
	}
	loopSounds();
    loadSettings(JSON.stringify(soundDefaults));
//    setupControls();
}
function stopAllSounds(oldRocks) {
	var rocks = rocks;
	if (oldRocks) {
		rocks = oldRocks;
	}
	for (var i in rocks) {
		if (!rocks[i]) continue;
		if (rocks[i].startSound)
			stopSound(rocks[i].startSound);
		if (rocks[i].midSound)
			stopSound(rocks[i].midSound);
		if (rocks[i].endSound)
			stopSound(rocks[i].endSound);
	}
}

var loopTimeout;
var fadeTime = 0.1;
function loopSounds() {
	for (var r = 0 ; r < rocks.length; r++) {
		if (rocks[r].originalNumber === 5) continue;
		if (rocks.length <= 2) {
			if (rocks[r].startSound.dryGainNode.gain.value !== 0) {
				rocks[r].startSound.dryGainNode.gain.linearRampToValueAtTime(rocks[r].startSound.dryGainNode.gain.value,audioContext.currentTime);
				rocks[r].startSound.dryGainNode.gain.linearRampToValueAtTime(0,audioContext.currentTime+fadeTime);
			}

			if (rocks[r].midSound.dryGainNode.gain.value !== 0) {
				rocks[r].midSound.dryGainNode.gain.linearRampToValueAtTime(rocks[r].midSound.dryGainNode.gain.value,audioContext.currentTime);
				rocks[r].midSound.dryGainNode.gain.linearRampToValueAtTime(0,audioContext.currentTime+fadeTime);
			}

			if (rocks[r].endSound.dryGainNode.gain.value !== 1) {
				rocks[r].endSound.dryGainNode.gain.linearRampToValueAtTime(rocks[r].endSound.dryGainNode.gain.value,audioContext.currentTime);
				rocks[r].endSound.dryGainNode.gain.linearRampToValueAtTime(1,audioContext.currentTime+fadeTime);
			}
		} else if (rocks.length <= 3) {
			if (rocks[r].startSound.dryGainNode.gain.value !== 0) {
				rocks[r].startSound.dryGainNode.gain.linearRampToValueAtTime(rocks[r].startSound.dryGainNode.gain.value,audioContext.currentTime);
				rocks[r].startSound.dryGainNode.gain.linearRampToValueAtTime(0,audioContext.currentTime+fadeTime);
			}

			if (rocks[r].midSound.dryGainNode.gain.value !== 1) {
				rocks[r].midSound.dryGainNode.gain.linearRampToValueAtTime(rocks[r].midSound.dryGainNode.gain.value,audioContext.currentTime);
				rocks[r].midSound.dryGainNode.gain.linearRampToValueAtTime(1,audioContext.currentTime+fadeTime);
			}

			if (rocks[r].endSound.dryGainNode.gain.value !== 0) {
				rocks[r].endSound.dryGainNode.gain.linearRampToValueAtTime(rocks[r].midSound.dryGainNode.gain.value,audioContext.currentTime);
				rocks[r].endSound.dryGainNode.gain.linearRampToValueAtTime(0,audioContext.currentTime+fadeTime);
			}
		} else {
			if (rocks[r].startSound.dryGainNode.gain.value !== 1) {
				rocks[r].startSound.dryGainNode.gain.linearRampToValueAtTime(1,audioContext.currentTime);
			}
			if (rocks[r].midSound.dryGainNode.gain.value !== 0) {
				rocks[r].midSound.dryGainNode.gain.linearRampToValueAtTime(0,audioContext.currentTime);
			}
			if (rocks[r].endSound.dryGainNode.gain.value !== 0) {
				rocks[r].endSound.dryGainNode.gain.linearRampToValueAtTime(0,audioContext.currentTime);
			}
		}
	}
	loopTimeout = setTimeout(loopSounds,(rocks[0].startSound.buffer.duration)*1000); 
}


if (window.location.protocol === "file:") {
    var songs = [
        "laurie_start",
        "drums_start",
        "adrums_start",
        "plink_start",
        "bass_start",
        "laurie_mid",
        "drums_mid",
        "adrums_mid",
        "plink_mid",
        "bass_mid",
        "laurie_end",
        "drums_end",
        "adrums_end",
        "plink_end",
        "bass_end"
    ];

    for (var s = 0 ; s < songs.length ; s++) {
        var url = "sounds/js/" + songs[s] + ".js";
        var script = document.createElement("script");
        script.type = "application/x-javascript";
        script.src = url;
        document.head.appendChild(script);
    }
}
var soundLoadProgress = 0;
function loadSounds() {
    if (!audioContext) {
		audioContext = new (window.AudioContext || window.webkitAudioContext);
    } else {
        return;
    }
//    stopAllSounds();

	var gotten = 0;
    var toGet = 15;
    soundLoadProgress = 0;

    function maybeStart() {
        gotten++;
        soundLoadProgress = gotten / toGet;
        if (gotten == toGet) {
            startAllSounds();
        }
    }

    if (window.location.protocol === "file:") {
        rocks[0].startSound = {sourceArray:laurie_start, url:1}
        rocks[1].startSound = {sourceArray:drums_start, url:2};
        rocks[2].startSound = {sourceArray:adrums_start, url:3};
        rocks[3].startSound = {sourceArray:plink_start, url:4};
        rocks[4].startSound = {sourceArray:bass_start, url:5};
        rocks[0].midSound = {sourceArray:laurie_mid, url:6}
        rocks[1].midSound = {sourceArray:drums_mid, url:7};
        rocks[2].midSound = {sourceArray:adrums_mid, url:8};
        rocks[3].midSound = {sourceArray:plink_mid, url:9};
        rocks[4].midSound = {sourceArray:bass_mid, url:10};
        rocks[0].endSound = {sourceArray:laurie_end, url:11}
        rocks[1].endSound = {sourceArray:drums_end, url:12};
        rocks[2].endSound = {sourceArray:adrums_end, url:13};
        rocks[3].endSound = {sourceArray:plink_end, url:14};
        rocks[4].endSound = {sourceArray:bass_end, url:15};
        for (var i in rocks) {
            var rock = rocks[i];
            rock.track = {};
            getSoundFromArray(rock.startSound, maybeStart);
            getSoundFromArray(rock.midSound, maybeStart);
            getSoundFromArray(rock.endSound, maybeStart);
        }
    } else {
        rocks[0].startSound = {url:"sounds/laurie_start.mp3"}
        rocks[1].startSound = {url:"sounds/drums_start.mp3"};
        rocks[2].startSound = {url:"sounds/adrums_start.mp3"};
        rocks[3].startSound = {url:"sounds/plink_start.mp3"};
        rocks[4].startSound = {url:"sounds/bass_start.mp3"};
        rocks[0].midSound = {url:"sounds/laurie_mid.mp3"}
        rocks[1].midSound = {url:"sounds/drums_mid.mp3"};
        rocks[2].midSound = {url:"sounds/adrums_mid.mp3"};
        rocks[3].midSound = {url:"sounds/plink_mid.mp3"};
        rocks[4].midSound = {url:"sounds/bass_mid.mp3"};
        rocks[0].endSound = {url:"sounds/laurie_end.mp3"}
        rocks[1].endSound = {url:"sounds/drums_end.mp3"};
        rocks[2].endSound = {url:"sounds/adrums_end.mp3"};
        rocks[3].endSound = {url:"sounds/plink_end.mp3"};
        rocks[4].endSound = {url:"sounds/bass_end.mp3"};
        for (var i in rocks) {
            var rock = rocks[i];
            rock.track = {};
            getSound(rock.startSound, maybeStart);
            getSound(rock.midSound, maybeStart);
            getSound(rock.endSound, maybeStart);
        }
    }

}
