var context;
var audioContext;

if (!window.navigator.userAgent.match(/chrom/i)) {
    $(function() {
        $("body").html("<h1>UPROK</h1><h2>Chrome only right now, sorry!</h2><p><a href=http://google.com/chrome>Get Chrome here</a></p>");
        throw "Error";
    });
}
//
//if (!(window.AudioContext || window.webkitAudioContext)) {
//    $(function() {
//        $("body").html("<h1>UPROK</h1><h2>Chrome or Firefox only, sorry!</h2><p><a href=http://google.com/chrome>Get Chrome here</a><a href=http://firefox.com/download>Get Firefox here</a></p>");
//        throw "Error";
//    });
//}

var ground = [];

var Vector2f = function(x, y) {
	this.x = x;
	this.y = y;
	return this;
}
var gravity = 0.004;
var groundForce = 0.008;
var littleGroundForce = 0.0001;
var groundFriction = {x:0.02, y:0.01};
var heavyAirFriction = 0.04;
var airFriction = 0.01;
var rockJumpGroundAcceleration = {x:0.0025, y:0.002};
var maxRockYSpeed = 5;
var minRockYSpeed = 2;
var gameDeclineTime = 50000;
var rockSpeedIncreasePerSecond = 0.000000006;
var loopdeloopDuration = 400;
var loopdeloopActionTime = 200;
var winnerText = "Someone";

var camera = {x:0, y:0};
var desiredCamera = {x:0, y:0};
var pointSpacing = 10;
var pointHeight = 30;
var screenSize = {x:2560, y:1600};
//var canvasSize = {x:1280, y:800};
var canvasSize = {x:640, y:400};
var groundPoints = 300000;
var levelSize = {x:groundPoints*pointSpacing, y:screenSize.y * 1000};

var cameraTracking = 0.2;
var cameraZoomingOut = 0.3;
var cameraZoomingIn = 0.001;
var cameraBorder = 0.15;
var minWorldScale = 0.2;
var maxWorldScale = 0.7;
var tinyWorldScale = 0.35;
var cameraAhead = 0.1;

var worldScale = 1;
var desiredWorldScale = 1;
var ticker = 0;
var rockTrailPointer = 0;
var rockTrailLength = 100;
var rockTrailInterval = 1;
var rockMinSize = 10;
var maxRockSpeed = 0;
var rocktrailWidth = 0.06;
var terminalYVel = 10;

var rocks = [];
var oldRocks = [];
var localRockScores = [];
var originalRocks = [];
var numberOfRocks = 5;
var localRocks = [];
var rockMap = {};
var rocksByPlayerId = {};

var gameId = -1;

var keys = {};
var mousePos = {};

var lastTime = new Date().getTime();
var thisTime = 0;
var delta = 0;
var interval = 0;
var targetInterval = 17;
var playerCountDown = 8000;
var endGame = false;
var leftInGameTime = 0;
var gameIsLocal = true;
var online = false;

var mode;
var game_start = 1;
var game_play = 2;
var game_end = 3;

var pause = false;
var manualControl = false;

var gameChoiceDiv;
var gameChoiceLocal;
var gameChoiceRemote;
var playerChoiceDiv;
var playerChoice = {};

var socket;

var drums = [];
var globalMods = [];
var globalModsUI = [];

var sliders = [];
var updateSlidersParam = {value:false, name:"update sliders"};
var previousSessionSettings;

var loopdeloopon = false;
var georgeMode = false;
var flowerMode = true;
var one_player_mode = false;

if (window.location.host.match("joeba")) {
    flowerMode = false;
    one_player_mode = true;
    loopdeloopon = true;
}

if (window.location.search.match(/one_player=yes/)) {
    one_player_mode = true;
}
else if (window.location.search.match(/one_player=no/)) {
    one_player_mode = false;
}


function init() {
	console.log("init!!!!");
	canvasSize.x = $(document).width();
	canvasSize.y = $(document).height();
	var canvas = document.getElementById("canvas");
	    canvas.height = canvasSize.y;
	    canvas.width = canvasSize.x;

	context = canvas.getContext("2d");

	window.onkeydown = keysdown;
	window.onkeyup = keysup;
	window.onmousemove = mousemove;



//    gameChoiceDiv = document.getElementById("gameChoice");
//    gameChoiceLocal = document.getElementById("localChoice");
//    gameChoiceLocal.onclick = chooseLocal;
//    gameChoiceRemote = document.getElementById("remoteChoice");
//    gameChoiceRemote.onclick = chooseRemote;

//    playerChoiceDiv = document.getElementById("playerNumberChoice");
//    for (var i = 1 ; i <= numberOfRocks ; i++) {
//        playerChoice[i] = document.getElementById(i+"player");
//        (function(i) {
//            playerChoice[i].onclick = function() {choosePlayers(i);}
//        })(i);
//    }

//    try {
//        socket = io.connect('http://127.0.0.1:1337');
//        socket.on('updatePlayers', updatePlayers);
//        socket.on('confirmPlayers', confirmPlayers);
//        socket.on('gameStart', gameStart);
//        socket.on('gameFinished', gameFinished);
//        socket.on('news', handleNews);
//        online = true;
//    } catch (e) {
//        console.log("couldn't load socket io " + e.toString());
		online = false;
//    }


	$("#canvasSizer").click(function() {
		if (canvas.width == 1280) {
			canvas.width = canvasSize.x = 640;
			canvas.height = canvasSize.y = 400;
		} else {
			canvas.width = canvasSize.x = 1280;
			canvas.height = canvasSize.y = 800;
		}
	});


	change_state(game_start);

	loop();
}

function makeToggle(params, name) {
	var param;
	if (params.length) {
		param = params[0];
	} else {
		param = params;
	}
	var box = $("<div>");
	
	var toggleControl = $("<input type='checkbox'>");
	if (typeof param.value === "function") {
		toggleControl.prop("checked",param.value());
	} else {
		toggleControl.prop("checked",param.value);
	}
	toggleControl.change(function() {
		var toggleControlVal = toggleControl.prop("checked");
		if (params.length) {
			for (var p in params) {
				param = params[p];
				if (typeof param.value === "function") {
					param.value(toggleControlVal);
				} else {
					param.value = toggleControlVal;
				}
			}
		} else {
			if (typeof param.value === "function") {
				param.value(toggleControlVal);
			} else {
				param.value = toggleControlVal;
			}
		}
	});

	box.append(toggleControl);

	var label = $("<div>");
	label.css("display", "inline-block");
	label.text(name?name:param.name);

	box.append(label);

	return box;
}

function makeMultichoice(param, name) {
	var box = $("<div>");
	box.addClass("clearfix");
	box.css("margin-bottom", "10px");
	

	var label = $("<div>");
	label.css("display", "inline-block");
	label.text(name?name:param.name);
	label.css("margin-right", "10px");

	box.append(label);
	var selectControl = $("<select>");
	for (var i in param.choices) {
		var option = $("<option>");
		option.attr("value", param.choices[i].value?param.choices[i].value:param.choices[i]);
		option.text(param.choices[i].name?param.choices[i].name:param.choices[i]);
		selectControl.append(option);
	}
	param.updateUI = function() {
		if (typeof param.value === "function") {
			selectControl.val(param.value());
		} else {
			selectControl.val(param.value);
		}
	};
	param.updateUI();
	selectControl.change(function() {
		if (typeof param.value === "function") {
			param.value(selectControl.val());
		} else {
			param.value = selectControl.val();
		}
	});

	box.append(selectControl);

	return box;
}

function makeSlider(audioParams, name) {
	var audioParam;
	if (audioParams.length) {
		audioParam = audioParams[0];
	} else {
		audioParam = audioParams;
	}

	var gainBox = $("<div>");

	var gainControl = $("<input type='hidden'>");
	var value;
	if (typeof audioParam.value === "function") {
		value = audioParam.value();
	} else {
		value = audioParam.value;
	}
	gainControl.val((value/(audioParam.maxValue-audioParam.minValue))*100);
	gainBox.append(gainControl);
	gainControl.PPSlider({width:300, name:name, hideTooltip:true, onChanged: function(e) {
		if (audioParams.length) {
			for (var i = 0 ; i < audioParams.length ; i++) {
				var anAudioParam = audioParams[i];
				if (typeof anAudioParam.value === "function") {
					anAudioParam.value((parseInt(gainControl.val())/100)*(anAudioParam.maxValue-anAudioParam.minValue));
				} else {
					anAudioParam.value = (parseInt(gainControl.val())/100)*(anAudioParam.maxValue-anAudioParam.minValue);
				}
			}
		} else {
			if (typeof audioParam.value === "function") {
				audioParam.value((parseInt(gainControl.val())/100)*(audioParam.maxValue-audioParam.minValue));
			} else {
				audioParam.value = (parseInt(gainControl.val())/100)*(audioParam.maxValue-audioParam.minValue);
			}
		}
	}});

	var gainText = $("<div>");
	gainText.css("float","left");
	if (name) {
		gainText.text(name);
	} else {
		gainText.text(audioParam.name);
	}
	gainBox.append(gainText);

	sliders.push({slider:gainControl[0].slider, param:audioParams});


	return gainBox;
}

function setupControls() {
	var controlDiv = $("#controls");
	controlDiv.empty();

	//global controls
	var globalControlsSurround = $("<div>");
	globalControlsSurround.addClass("controlBox");
	controlDiv.append(globalControlsSurround);

	var globalControlsTitle = $("<div>");
	globalControlsSurround.append(globalControlsTitle);
	globalControlsTitle.text("Global controls");
	globalControlsTitle.addClass("controlTitle");

	var globalControls = $("<div>");
	globalControlsSurround.append(globalControls);
	globalControls.addClass("controlsContent clearfix");
	globalControls.append(makeToggle(updateSlidersParam));
	globalControls.append(makeToggle(_.map(rocks,
					function(rock) {
						return {
							value: function(value) {
									   if (value !== undefined) {
										   rock.autopilot = value;
									   } else {
										   return rock.autopilot;
									   }
								   }
						}
					}), "autopilot"));

	globalControls.append(makeSlider(_.map(rocks, function(rock){return rock.track.filterNode.frequency;})));
	globalControls.append(makeSlider(_.map(rocks, function(rock){return rock.track.filterNode.Q;})));
	var filterTypeObj = {
		value: function(value) {
				   if (value) {
					   for (var r in rocks) {
						   var rock = rocks[r];
						   (function(rock) {
							   rock.track.filterNode.type = parseInt(value);
							   //this is to make sure the change is noticed, not reliable though
							   setTimeout( function() {
								   rock.track.filterNode.frequency.value += 1;
								   setTimeout( function() {
									   rock.track.filterNode.frequency.value -= 1;
								   }, 300);
							   }, 300);
						   })(rock);
					   }
				   } else {
					   return rocks[0].track.filterNode.type;
				   }
			   },
		choices: [
		{name: "lowpass", value:0},
		{name: "highpass", value:1},
		{name: "bandpass", value:2}
		]
	};
	var filterMultiChoice = makeMultichoice(filterTypeObj, "filter type");
	globalControls.append(filterMultiChoice);

	globalMods = [];
	globalModsUI = [];
	for (var i = 0 ; i < 10 ; i++) {
		(function(i) {
			var box = $("<div>");
			var paramGettersObj = {
				value: function(value) {
						   if (value !== undefined) {
							   if (!globalMods[i]) {
								   globalMods[i] = {};
							   }
							   globalMods[i].param = value;
						   } else {
							   if (globalMods[i]) {
								   return globalMods[i].param;
							   }
						   }
					   },
				choices: _.union([""],_.keys(paramGetters))
			};
			var paramMultiChoice = makeMultichoice(paramGettersObj, "param ");
			globalModsUI.push(paramGettersObj);
			box.append(paramMultiChoice);
			var modFuncsObj = {
				value: function(value) {
						   if (value !== undefined) {
							   if (!globalMods[i]) {
								   globalMods[i] = {};
							   }
							   globalMods[i].func = value;
						   } else {
							   if (globalMods[i]) {
								   return globalMods[i].func;
							   }
						   }
					   },
				choices: _.union([""],_.keys(modFuncs))
			};
			var funcMultiChoice = makeMultichoice(modFuncsObj, " modifies ");
			globalModsUI.push(modFuncsObj);
			box.append(funcMultiChoice);

			globalControls.append(box);
		})(i);
	}
	globalControlsTitle.click(function() {
		globalControls.toggle("fast");
	});
	

	// per rock controls
	for (var i in rocks) {
		var rock = rocks[i];

		var surroundBox = $("<div>");
		surroundBox.addClass("controlBox");
		var rockControls = $("<div>");
		rockControls.addClass("controlsContent clearfix");

		var title = $("<div>");
		title.text("Rock " + (parseInt(i)+1));
		(function(rockControls) {
			title.click(function() {
				rockControls.toggle("fast");
			});
		})(rockControls);
		title.addClass("controlTitle");

		surroundBox.append(title);
		surroundBox.append(rockControls);

		(function(rock) {
			rockControls.append(makeToggle({
				value:function(value) {
						  if (value === undefined) {
							  rock.autopilot = value;
						  } else {
							  return rock.autopilot;
						  }
					  }}, "autopilot")
				);
		})(rock);
		rockControls.append(makeSlider(rock.startSound.dryGainNode.gain, "start gain"));
		rockControls.append(makeSlider(rock.midSound.dryGainNode.gain, "mid gain"));
		rockControls.append(makeSlider(rock.track.wetGainNode.gain, "track gain"));

		(function(rock) {
			var filterTypeObj = {
				value: function(value) {
						   if (value) {
							   rock.track.filterNode.type = parseInt(value);
							   //this is to make sure the change is noticed, not reliable though
							   setTimeout( function() {
								   rock.track.filterNode.frequency.value += 1;
								   setTimeout( function() {
									   rock.track.filterNode.frequency.value -= 1;
								   }, 300);
							   }, 300);
						   } else {
							   return rock.track.filterNode.type;
						   }
					   },
			choices: [
				{name: "lowpass", value:0},
				{name: "highpass", value:1},
				{name: "bandpass", value:2}
//				{name: "low shelf", value:3},
//				{name: "high shelf", value:4},
//				{name: "peaking", value:5},
//				{name: "notch", value:6},
//				{name: "allpass", value:7}
			]
			};
			rockControls.append(makeMultichoice(filterTypeObj, "filter type"));
		})(rock);
		rockControls.append(makeSlider(rock.track.filterNode.frequency, "frequency"+rock.originalNumber));
		rockControls.append(makeSlider(rock.track.filterNode.Q));
//		rockControls.append(makeSlider(rock.track.filterNode.gain, "filter gain"));


		rockControls.append(makeSlider(rock.track.delayNode.delayTime));
		rockControls.append(makeSlider(rock.track.delayGainNode.gain, "delay feedback"));
		(function(rock){
			var filterNumberObj = {
				value: function(value) {
					if (value) {
						rock.magicFilterNumber = value;
					} else {
						return rock.magicFilterNumber;
					}
				},
				minValue: 0.0,
				maxValue: 1.2,
				defaultValue: 0.8,
			};
			rockControls.append(makeSlider(filterNumberObj, "magic filter number"));
		})(rock);

		controlDiv.append(surroundBox);
	}

	// load and save
	$("#loadButton").change(function(e) {
		var reader = new FileReader();
		reader.onload = function(e) {
			loadSettings(e.target.result);
		};
		reader.readAsText(this.files[0]);
	});
	$("#saveButton").click(function() {
		var content = {
			globalMods: globalMods,
			rocks: _.map(originalRocks, rock2SoundParams)
		};
		var uriContent = "data:application/octet-stream," + encodeURIComponent(JSON.stringify(content));
		var newWindow = window.open(uriContent, 'neuesDokument');
	});

	if (previousSessionSettings) {
		loadSettings(previousSessionSettings);
	} else {
		loadSettings(JSON.stringify(soundDefaults));
//        $.get("default.json", function(string) {loadSettings(string);});
	}
}

function loadSettings(settingsString) {
	try {
		var content;
		if (typeof settingsString === "string") {
			content = JSON.parse(settingsString);
		} else {
			content = settingsString;
		}
		previousSessionSettings = content;
		if (content.globalMods) {
			globalMods = content.globalMods;
			for (var g in globalModsUI) {
				globalModsUI[g].updateUI();
			}
		} else {
			throw "error";
		}
		if (content.rocks) {
			for (var r in rocks) {
				soundParams2Rock(rocks[r], content.rocks[r]);
			}
			updateSliders();
		} else {
			throw "error";
		}
	} catch(e) {
		window.alert("Could not read settings file");
	}
}

function rock2SoundParams(rock) {
	var params = {};
	params.startGain = rock.startSound.dryGainNode.gain.value;
//    params.sparseGain = rock.sparseSound.dryGainNode.gain.value;
	params.wetGain = rock.track.wetGainNode.gain.value;
	params.filterFrequency = rock.track.filterNode.frequency.value;
	params.filterResonance = rock.track.filterNode.Q.value;
	params.filterType = rock.track.filterNode.type;
	params.delayTime = rock.track.delayNode.delayTime.value;
	params.delayFeedback = rock.track.delayGainNode.gain.value;
	params.magicFilterNumber = rock.magicFilterNumber;
	return params;
}
function soundParams2Rock(rock, params) {
//    rock.startSound.dryGainNode.gain.value = params.startGain;
//    rock.sparseSound.dryGainNode.gain.value = params.sparseGain;
//    rock.track.wetGainNode.gain.value = params.wetGain;
	rock.track.filterNode.frequency.value = params.filterFrequency;
	rock.track.filterNode.Q.value = params.filterResonance;
	rock.track.filterNode.type = params.filterType;
	rock.track.delayNode.delayTime.value = params.delayTime;
	rock.track.delayGainNode.gain.value = params.delayFeedback;
	rock.magicFilterNumber = params.magicFilterNumber;
}

function gameStart(data) {
}
function gameFinished(data) {
}
function handleNews(data) {
}

function chooseRemote() {
	console.log("remote game");
	gameIsLocal = false;
}
function chooseLocal() {
	console.log("local game");
	gameIsLocal = true;
	for (var i = 0 ; i < numberOfRocks ; i++) {
		if (!rocks[i].local) {
			setLocalPlayer(i);
		}
	}
}
function setLocalPlayer(i) {
	var rock = rocks[i];
	rock.local = true;
}

function confirmPlayers(players) {
}
function choosePlayers(n) {
	console.log("choose players " + n);
	playerChoiceDiv.style.display = "none";
	socket.emit('joinPlayers', {players:n});
}

function updatePlayers(players) {
	for (var player_i in players) {
		var player = players[player_i];
		var rock = rocks[player_i];
		if (player.in && !rock.local && !rock.in) {
			joinRock(player_i, false);
		}
	}
}

function startingGrid() {
	if (false && Math.floor(Math.random() * 200) === 0) {
		georgeMode = true;
		numberOfRocks = 6;
	} else {
		georgeMode = false;
		numberOfRocks = 5;
	}
	for (var i = 0 ; i < numberOfRocks ; i++) {
		if (!localRockScores[i]) {
			localRockScores[i] = 0;
		}
		if (oldRocks[i]) {
			rocks[i] = oldRocks[i];
		} else {
			rocks[i] = {};
			oldRocks[i] = rocks[i];
		}
		rocks[i].x = pointSpacing * 2;
		rocks[i].y = 300;
		rocks[i].size = rockMinSize;
		rocks[i].velocity = {x:0, y:0};
		rocks[i].acceleration = {x:0, y:0};
		rocks[i].x = 0;
		rocks[i].y = 0;
		rocks[i].maxVelocity = {x:0, y:0};
		rocks[i].force = {x:0, y:0};
		rocks[i].speed = 1;
		rocks[i].trail = [];
		rocks[i].speedDivId = "player" + (i+1) + "speed";
		rocks[i].scoreDivId = "player" + (i+1) + "score";
		rocks[i].actionDivId = "player" + (i+1) + "action";
		rocks[i].startLogoElement = document.getElementById("startLogo"+(i+1));
		rocks[i].originalNumber = i;
		rocks[i].player_id = -1;
		rocks[i].local = false;
		rocks[i].autopilot = false;
		rocks[i].magicFilterNumber = 0.8;
		rocks[i].lastOn = 0;
		rocks[i].lastOff = 0;
		rockMap[i] = rocks[i];
	}

//    rocks[0].onKey = 90;//z
//    rocks[1].onKey = 67;//c
//    rocks[2].onKey = 88;//x
//    rocks[3].onKey = 78;//n
//    rocks[4].onKey = 66;//b
	rocks[0].onKey = 49;//1
	rocks[1].onKey = 50;//2
	rocks[2].onKey = 51;//3
	rocks[3].onKey = 52;//4
	rocks[4].onKey = 53;//5

	rocks[0].colour = "#d82095";
	rocks[0].r = 216; rocks[0].g = 32; rocks[0].b = 149;
	rocks[1].colour = "#99df19";
	rocks[1].r = 153; rocks[1].g = 223; rocks[1].b = 25;
	rocks[2].colour = "#0cc4ec";
	rocks[2].r = 12; rocks[2].g = 196; rocks[2].b = 236;
	rocks[3].colour = "#fa611e";
	rocks[3].r = 250; rocks[3].g = 97; rocks[3].b = 30;
	rocks[4].colour = "#710bf6";
	rocks[4].r = 113; rocks[4].g = 11; rocks[4].b = 246;

	if (!georgeMode) {
		rocks[0].letter = "U";
		rocks[1].letter = "P";
		rocks[2].letter = "R";
		rocks[3].letter = "O";
		rocks[4].letter = "K";
	} else {
		rocks[0].letter = "G";
		rocks[1].letter = "E";
		rocks[2].letter = "O";
		rocks[3].letter = "R";
		rocks[4].letter = "G";
		rocks[5].letter = "E";

		rocks[5].colour = "#dcc20d";
		rocks[5].r = 220; rocks[5].g = 194; rocks[5].b = 13;
		rocks[5].autopilot = true;
	}

	for (var i in rocks) {
//        rocks[i].elementSpeed = document.getElementById(rocks[i].speedDivId);
//        rocks[i].elementSpeed.style.color = rocks[i].colour;
//        rocks[i].elementScore = document.getElementById(rocks[i].scoreDivId);
//        rocks[i].elementAction = document.getElementById(rocks[i].actionDivId);
//        rocks[i].elementAction.style.backgroundColor = rocks[i].colour;

		var rock = rocks[i];
		rock.x = ((Number(i)+1)*(canvasSize.x/((numberOfRocks+1)*2)));
//        console.log("i" + i + "c" + camera.x + " ws " + worldScale + " cs" + canvasSize.x + " rx" + rock.x);
//        context.arc((rock.x - camera.x)*worldScale, (rock.y - camera.y)*worldScale, rockMinSize*worldScale, 0, Math.PI*2, true);
		rock.y = levelSize.y - 800;
		rock.velocity = {x:0, y:0};
		rock.acceleration = {x:0, y:0};
		rock.trail = [];
		for (var t = 0 ; t < rockTrailLength ; t++) {
			rock.trail[t] = {x:rock.x, y:rock.y, underGround:false};
		}
		rock.force = {x:0, y:0};
		rock.maxVelocity = {x:0, y:0};
		rock.in = false;
		rock.on = false;
		rock.weight = 1;
//        rock.startLogoElement.style.color = "#000000";
		//    rock.startLogoElement.style.visibility = "hidden";
	}
	rocksIn = 0;

	loadSounds();
	// make the level

	var y = levelSize.y - 700;
	var x = 0;
	var yVel = 0;
	var maxYVel = 1;
	var borderTopY = levelSize.y - 1200;
	var borderBottomY = levelSize.y - 600;
	for (var i = 0 ; i <= groundPoints ; i++) {
		maxYVel = i /500 + 1;
		if (maxYVel > 30) maxYVel = 30;
		var newy;
		do {
			yVel += (Math.random()-0.5)*(maxYVel);
			if (yVel > maxYVel) yVel = maxYVel;
			if (yVel < -maxYVel) yVel = -maxYVel;
			newy = y + yVel;
			if (y < borderTopY || y > borderBottomY) yVel = 0;
			borderTopY -= 20;
		} while (newy < borderTopY || newy > borderBottomY);
		y = newy;
		x = i * pointSpacing;
		ground[i] = new Vector2f(x,y);
	}

	minWorldScale = 0.15;
	maxRockSpeed = 0;

	endGame = false;
	leftInGameTime = 0;


	camera.y = levelSize.y - 900;
	desiredCamera.y = levelSize.y - 900;
	camera.x = 0;
	desiredCamera.x = 0;
	worldScale = 2;

	originalRocks = [];
	_.each(rocks, function(rock){originalRocks.push(rock);});

}

function keysup(e) {
	keys[e.keyCode] = false;
}

function keysdown(e) {
	keys[e.keyCode] = true;
}

function mousemove(e) {
	mousePos.x = e.pageX;
	mousePos.y = e.pageY;
}

function joinRock(i, local) {
	var rock = rocks[i];
	if (!rock.in) {
		console.log("joined rock" + i);
		rocksIn++;
		rock.in = true;
		rock.local = local;
		rock.joinTime = timeInStart;
		if (local && !gameIsLocal) {
			initRemote(rock);
		}
	}
}

function leaveRock(i) {
	var rock = rocks[i];
	if (rock.in) {
		console.log("joined rock" + i);
		rocksIn--;
		rock.in = false;
	}
}

function controlSound() {
	if (keys[73]) { //i
//        muteSound(drums[0]);
	}
	if (keys[85]) { //u
//        unMuteSound(drums[0]);
	}
}

var rocksIn = 0;
var timeInStart = 0;
var timeLeftInStart = 0;
var raceCountDown = 0;
var doingRaceCountDown = false;
var flashed2 = false;
var flashed1 = false;
var flash = 0;
function run_start(delta) {
	timeInStart += delta;

	controlSound();

	for (var i in rocks) {
		var rock = rocks[i];
		if ((keys[rock.onKey] && rock.local) || (one_player_mode && rocks[0].in && i > 0 && timeInStart-rocks[0].joinTime > i*1000)) {
			joinRock(i, true);
		}
	}

	if (rocksIn >= 2 && (!one_player_mode || rocks[0].in)) {
		timeLeftInStart -=delta;
	} else {
		timeLeftInStart = playerCountDown;
	}
	if (doingRaceCountDown) {
		if (raceCountDown <= 0) {
			change_state(game_play);
		} else if (raceCountDown <= 2000 && !flashed2) {
			flash = 1;
			flashed2 = true;
			for (var i in rocks) {
				rocks[i].on = true;
			}
		} else if (raceCountDown <= 1000 && !flashed1) {
			flash = 1;
			flashed1 = true;
			for (var i in rocks) {
				rocks[i].on = false;
			}
		}
		raceCountDown -=delta;
	}
	else if (timeLeftInStart <= 0 || rocksIn == numberOfRocks) {
		console.log("starting game");
		camera.y = levelSize.y - 900;
		desiredCamera.y = levelSize.y - 900;
		worldScale = 2;
		raceCountDown = 3000;
		doingRaceCountDown = true;
		muteAllSounds(oldRocks,1);
		flashed1 = false;
		flashed2 = false;
		startTime = new Date();
		do {
			var foundOne = false;
			for (var i in rocks) {
				if (!rocks[i].in) {
					removeRock(i);
					foundOne = true;
					break;
				}
			}
		} while (foundOne);
	} else if (georgeMode && (rocksIn == numberOfRocks-1 || timeLeftInStart < 1000)) {
		joinRock(numberOfRocks-1);
	}
	if (flash > 0) {
		flash = flash - (delta*0.002);
	} else {
		flash = 0;
	}

}

var timeInEnd = 0;
function run_end(delta) {

	muteAllSounds(rocks, 1);
	setTimeout(function(){
		location.reload(true);
	}, 1000);
//    stopAllSounds();
//    change_state(game_start);

}

function setForPlay() {
	//  worldScale = 5; // start really big
//    stopAllSounds(oldRocks);
//    startAllSounds();
}

function change_state(new_state) {
	switch (new_state) {
		case game_start:
			startingGrid();
			chooseLocal();
			draw();
			timeLeftInStart = playerCountDown;
			doingRaceCountDown = false;
			timeInStart = 0;
			break;
		case game_play:
			setForPlay();
			break;
		case game_end:
			endGame = false;
			localRockScores[rocks[0].originalNumber]++;
			timeInEnd = 3000;
			break;
	}
	mode = new_state;
}

function loop() {
	thisTime = new Date().getTime();
	delta = thisTime-lastTime;
	lastTime = thisTime;

	switch (mode) {
		case game_start:
			run_start(delta);
			synchronise();
			draw();
			break;
		case game_play:
			update(delta);
			draw();
			synchronise();
			break;
		case game_end:
			run_end(delta);
			draw();
			break;
	}

	if (updateSlidersParam.value) {
		updateSliders();
	}

	interval = targetInterval - (new Date().getTime() - thisTime);
	interval = interval < 1 ? 1 : interval;
	setTimeout(loop, interval);
}

function updateSliders() {
	_.each(sliders, function(slider) {
		if (slider.param.length) {
			//slider.slider.setValue((slider.param[0].value/(slider.param[0].maxValue-slider.param[0].minValue))*100);
		} else {
			if (typeof slider.param.value === "function") {
				slider.slider.setValue((slider.param.value()/(slider.param.maxValue-slider.param.minValue))*100);
			} else {
				slider.slider.setValue((slider.param.value/(slider.param.maxValue-slider.param.minValue))*100);
			}
		}
	});
}

function scaleWorld(scale)
{
	var tooFar = false;
	if (scale < minWorldScale) {
		tooFar = true;
		scale = minWorldScale;
	}
	if (scale > maxWorldScale) {
		scale = maxWorldScale;
	}
	desiredWorldScale = scale;

	return tooFar;
}

function panCamera(x,y) {
	if (x < 0) x = 0;
	if (x > levelSize.x - screenSize.x) x = levelSize.x - screenSize.x;
	if (y < 0) y = 0;
	if (y > levelSize.y - screenSize.y) y = levelSize.y - screenSize.y;
	desiredCamera.x = x;
	desiredCamera.y = y;
}


var xZoom;
var yZoom;
var zoom;
var tooFar;
var viewRect;
var actualViewRect;
var slowest;
var i;
var rock;
var currentMaxYSpeed;
var gameTime;
var startTime;
function update(delta)
{
	gameTime = new Date()-startTime;

	viewRect = {top:Number.MAX_VALUE, bottom:0, left:Number.MAX_VALUE, right:0};

	if (rocks.length == 1) {
		if (!endGame) {
			endGame = true;
			switch (rocks[0].originalNumber) {
				case 0:
					winnerText = "Pink";
					break;
				case 1:
					winnerText = "Green";
					break;
				case 2:
					winnerText = "Blue";
					break;
				case 3:
					winnerText = "Orange";
					break;
				case 4:
					winnerText = "Purple";
					break;
				case 5:
					winnerText = "George";
					break;
			}
			leftInGameTime = 10000;
		}

		leftInGameTime -= delta;

		if (leftInGameTime < 0) {
			change_state(game_end);
		}
	}
	for (i in rocks) {
		rock = rocks[i];
		if (one_player_mode) {
			if (rock.originalNumber === 0) {
				rock.autopilot = false;
			} else {
				rock.autopilot = true;
			}
		} else {
			rock.autopilot = false;
		}

//        if (!rock.autopilot) {
//            rock.on = false;
//        }
		if (!rock.autopilot) {
			if (keys[rock.onKey]) {//z
				if (!rock.on) {
					rock.lastOn = gameTime;
				}
				rock.on = true;
				if (loopdeloopon && !rock.loopdeloop && gameTime - rock.lastOff < loopdeloopActionTime) {
					rock.loopdeloop = true;
					rock.loopdeloopStart = gameTime;
					rock.loopdeloopVelocity = Math.sqrt(rock.velocity.x*rock.velocity.x + rock.velocity.y*rock.velocity.y);
					rock.loopdeloopAngle = Math.atan2(rock.velocity.x, rock.velocity.y);
				}
			} else {
				if (rock.on) {
					rock.lastOff = gameTime;
				}
				rock.on = false;
//                console.log(rock.lastOn + ", " + (gameTime - rock.lastOn));
				if (loopdeloopon && !rock.loopdeloop && gameTime - rock.lastOn < loopdeloopActionTime) {
					rock.loopdeloop = true;
					rock.loopdeloopStart = gameTime;
					rock.loopdeloopVelocity = Math.sqrt(rock.velocity.x*rock.velocity.x + rock.velocity.y*rock.velocity.y);
					rock.loopdeloopAngle = Math.atan2(rock.velocity.x, rock.velocity.y);
				}
			}
		}
		controlSound();

		restrictToLevel(rock);
		rock.underGround = isBelowGround(rock);
		if (rock.autopilot) {
			if (ticker % 10 == 0) {
				rock.on = rock.underGround;
			}
		}

		rock.force.y = (rock.velocity.y/rock.weight)/delta;
		rock.force.x = (rock.velocity.x/rock.weight)/delta;

		//acceleration

		rock.acceleration.x = 0;
		if (rock.underGround) {
		rock.acceleration.y = -gravity;
			rock.acceleration.x += -rock.force.x * groundFriction.x;
			if (rock.on) {
				rock.acceleration.x += (rockJumpGroundAcceleration.x + rockSpeedIncreasePerSecond*gameTime)*rock.speed;
				rock.acceleration.y -= rockJumpGroundAcceleration.y;
			}
		} else {
		rock.acceleration.y = gravity;
			if (rock.on) {
				rock.acceleration.x -= rock.force.x * heavyAirFriction*rock.speed;
			}
		}

		// velocity

		rock.velocity.y += rock.acceleration.y * delta;
		currentMaxYSpeed = maxRockYSpeed - (gameTime/gameDeclineTime);
//        console.log(currentMaxYSpeed);
		if (currentMaxYSpeed < minRockYSpeed) currentMaxYSpeed = minRockYSpeed;
		if (rock.velocity.y < -currentMaxYSpeed) rock.velocity.y = -currentMaxYSpeed;
//        if (rock.velocity.y > currentMaxYSpeed) rock.velocity.y = currentMaxYSpeed;
		rock.velocity.x += rock.acceleration.x * delta;

		if (loopdeloopon && rock.loopdeloop) {
			rock.loopdeloopVelocity += 0.001 * delta;
			var loopdeloopTime = gameTime - rock.loopdeloopStart;
			rock.velocity.x = Math.sin(Math.PI*2*loopdeloopTime/loopdeloopDuration + rock.loopdeloopAngle)*rock.loopdeloopVelocity;
			rock.velocity.y = Math.cos(Math.PI*2*loopdeloopTime/loopdeloopDuration + rock.loopdeloopAngle)*rock.loopdeloopVelocity;
			var loopAmount = Math.PI+(Math.PI-rock.loopdeloopAngle)*2;
			loopAmount -= Math.PI;
			loopAmount %= 2*Math.PI;
			loopAmount += Math.PI;
			loopAmount /= 2*Math.PI;
			if (loopdeloopTime > loopdeloopDuration*loopAmount) {
				rock.loopdeloop = false;
			}
		}

		if ( manualControl) {
			var speed = 50;
			if ( keys[38]) { //up
				rock.y -= speed;
			}
			if (keys[40]) { //down
				rock.y += speed;
			}
			if (keys[37]) { //left
				rock.x -= speed;
			}
			if (keys[39]) { //right
				rock.x += speed;
			}
			worldScale = 0.2;
		} else {
			rock.y += rock.velocity.y * delta;
			rock.x += rock.velocity.x * delta;
		}

		if (rock.velocity.x > rock.maxVelocity.x) rock.maxVelocity.x = rock.velocity.x;
		if (Math.abs(rock.velocity.y) > rock.maxVelocity.y) rock.maxVelocity.y = Math.abs(rock.velocity.y);

		


		restrictToLevel(rock);

		// camera

		if ( rock.y < viewRect.top ) viewRect.top = rock.y;
		if ( rock.y > viewRect.bottom ) viewRect.bottom = rock.y;
		if ( rock.x < viewRect.left ) {
			slowest = i;
			viewRect.left = rock.x;
		}
		if ( rock.x > viewRect.right ) viewRect.right = rock.x;

		// trails
		if (rock.on || rock.loopdeloop) {
			rock.trail[rockTrailPointer] = {x:rock.x, y:rock.y, underGround:rock.underGround};
		}
	}
	for (i in rocks) {
		rock = rocks[i];
		//sounds
		adjustSoundForRock(rock);
	}

	if (ticker % 2 == 0) {
		rockTrailPointer++;
		if (rockTrailPointer >= rockTrailLength) {
			rockTrailPointer = 0;
		}
		for (i in rocks) {
			rocks[i].trail[rockTrailPointer] = false;
		}
	}

	if (rocks.length == 1) {
		panCamera(rocks[0].x - screenSize.x/4, rocks[0].y - screenSize.y/2);

		if (rocks[0].loopdeloop) {
			scaleWorld(0.5/rocks[0].loopdeloopVelocity);
		} else {
			scaleWorld(0.5/rocks[0].velocity.x);
		}
	} else {
		panCamera(((viewRect.left + viewRect.right) /2 - ((screenSize.x*(1-cameraAhead))/2)), (viewRect.top + viewRect.bottom) /2 - screenSize.y/2);

		xZoom = (canvasSize.x / (viewRect.right-viewRect.left))*(1-cameraBorder);
		yZoom = (canvasSize.y / (viewRect.bottom-viewRect.top))*(1-cameraBorder);
		if (xZoom < yZoom) {
			tooFar = scaleWorld(xZoom);
		} else {
			tooFar = scaleWorld(xZoom);
			scaleWorld(yZoom);
		}
//        drums[0].filterNode.frequency
		var filterVal = (xZoom-minWorldScale)/(maxWorldScale-minWorldScale);
		if (filterVal < 0)filterVal = 0;
		if (filterVal > 1)filterVal = 1;
		filterVal = 1-filterVal;
		filterVal /= 3;
		filterVal += 0.66;
//        drums[0].filterNode.frequency.value = Math.pow(2, filterVal*10);

		if (tooFar && slowest) {
			//someone is out
			removeRock(slowest);
			console.log("booting out " + slowest);
		}
	}


}

function initRemote(rock) {
	if (gameId === -1) {
		$.getJSON('http://127.0.0.1:1337/game', {}, function (game) {
				joinRock(game.player_id, true, rock);
				gameId = game.game_id;
				console.log("registered player " + JSON.stringify(game));
				}).
		error(function() {
			console.log("error registering player");
		});
	} else {
		$.getJSON('http://127.0.0.1:1337/game/'+gameId, {}, function (game) {
				joinRock(game.player_id, true, rock);
				console.log("registered player " + JSON.stringify(game));
				}).
		error(function() {
			console.log("error registering player");
		});
	}
}

function checkForRemotePlayers() {
	$.getJSON('/players', {game_id:gameId}, function(players) {
		for (var i = 0 ; i < players.length ; i++) {
			if (players[i]) {
				joinRock(players[i].player_id, false);
			}
		}
	}).error(function() {
		console.log("error getting players");
	});
}

function synchronise() {
	if (gameIsLocal) return;
	if (ticker % 30 == 0) {
		for (var i in rocks) {
			if (rock.local) {
				localRocks.push({i: i, x:rock.x, y:rock.y, in:rock.in, on:rock.on});
			}
		}
		socket.emit("updatePlayers", localRocks);
	}
}

function removeRock(i) {
//    rocks[i].elementSpeed.innerHTML = "Out";
	muteSound(rocks[i].track);
	rocks.splice(i,1);
}

function draw() {
	if (mode == game_play) {
		if (desiredWorldScale < worldScale) {
			worldScale = worldScale*(1-cameraZoomingOut) + desiredWorldScale*cameraZoomingOut;
		} else {
			worldScale = worldScale*(1-cameraZoomingIn) + desiredWorldScale*cameraZoomingIn;
		}

		camera.x = camera.x*(1-cameraTracking) + desiredCamera.x*cameraTracking;
		camera.y = camera.y*(1-cameraTracking) + desiredCamera.y*cameraTracking;
	} else if (mode === game_start && doingRaceCountDown && raceCountDown < 500) {
		worldScale = worldScale*(0.9) + desiredWorldScale*0.1;
		camera.x = camera.x*(1-cameraTracking) + desiredCamera.x*cameraTracking;
		camera.y = camera.y*(1-cameraTracking) + desiredCamera.y*cameraTracking;
	}
	screenSize.x = canvasSize.x / worldScale;
	screenSize.y = canvasSize.y / worldScale;

	actualViewRect = {left: camera.x, top:camera.y, right: camera.x+screenSize.x, bottom: camera.y+screenSize.y};

	context.fillStyle="#ffffff";
	context.fillRect(0,0,screenSize.x*worldScale, screenSize.y*worldScale);
	



	var i = Math.floor(camera.x/pointSpacing);
	var lim = Math.ceil((screenSize.x + camera.x)/pointSpacing);
	if (lim >= groundPoints) lim = groundPoints-1;
	context.strokeStyle = "rgba(0,0,0," + (1-flash) + ")";//"#000000";
	context.fillStyle = "rgba(0,0,0," + (1-flash) + ")";//"#000000";
	context.lineWidth = 5*worldScale;
	context.beginPath();
	context.lineTo(-1000,levelSize.y*worldScale+1000);
	for (; i <= lim; i++) {
		context.lineTo((ground[i].x - camera.x)*worldScale, (ground[i].y - camera.y)*worldScale);
	}
	context.lineTo(levelSize.x*worldScale+1000, levelSize.y*worldScale+1000);
	context.closePath();
	context.fill();

	for (var i in rocks) {
		var rock = rocks[i];
		if (!rock.in) {
			if (mode == game_start) {
				var textToDisplay;
				if (localRockScores[i] > 0) {
					textToDisplay = localRockScores[i];
				} else {
					textToDisplay = rock.letter;
				}
				var textMeasurements = context.measureText(textToDisplay);
				context.font = "100px ostrich-black";
				context.fillStyle = rock.colour;
				context.fillText(textToDisplay, (rock.x - camera.x)*worldScale - textMeasurements.width*0.5, (rock.y+20 - camera.y)*worldScale);

				context.font = "100px ostrich-bold";
				context.fillStyle = "#000000";
				context.fillText(textToDisplay, (rock.x - camera.x)*worldScale - textMeasurements.width*0.5, (rock.y+20 - camera.y)*worldScale);
			}
			continue;
		}
		if (rock.on) {
			context.fillStyle = rock.colour;
		} else {
			context.fillStyle ="rgba(0,0,0," + (1-flash) + ")";// "#000000";
		}
		context.beginPath();
		context.arc((rock.x - camera.x)*worldScale, (rock.y - camera.y)*worldScale, rockMinSize*worldScale, 0, Math.PI*2, true);
		context.fill();
		
		if (worldScale < tinyWorldScale) {
			context.strokeStyle = "rgba("+rock.r + "," + rock.g + "," + rock.b + ", " + (0.8-(worldScale-minWorldScale)/(tinyWorldScale-minWorldScale)) + ")";
			context.lineWidth = 10*worldScale;
			context.beginPath();
			context.arc((rock.x - camera.x)*worldScale, (rock.y - camera.y)*worldScale, rockMinSize*5*worldScale, 0, Math.PI*2, true);
			context.stroke();
		}

		if (rock.on) {
			//context.fillStyle ="rgba(0,0,0," + (1-flash) + ")";// "#000000";
		} else {
			context.fillStyle = rock.colour;
			context.beginPath();
			context.arc((rock.x - camera.x)*worldScale, (rock.y - camera.y)*worldScale, (rockMinSize*0.5)*worldScale, 0, Math.PI*2, true);
			context.fill();
		}
		


//        if (ticker%5 == 0) {
//            rock.elementSpeed.innerHTML = (rock.velocity.x*100).toFixed(2) + " mph";
//            rock.elementScore.innerHTML = (rock.maxVelocity.x*100).toFixed(2) + " mph";

//        }
	}

		context.strokeStyle = rock.colour;
		context.lineWidth = rock.size*rockMinSize*rocktrailWidth*worldScale;
		var j;
		var prevj;
		var first = true;
		for (var i = rockTrailLength-1 ; i >= 0 ; i--) {
			prevj = j;
			j = ((rockTrailPointer-i)+rockTrailLength)%rockTrailLength;
			if (!first) {
				for (var r in rocks) {
					var rock = rocks[r];
					if (rock.trail[j] && !rock.first) {
						context.strokeStyle = rock.colour;
						context.lineWidth = rock.size*rockMinSize*rocktrailWidth*worldScale*Math.log(i+1);
						context.beginPath();
						context.moveTo((rock.trail[prevj].x - camera.x)*worldScale, (rock.trail[prevj].y - camera.y)*worldScale);
						if (!rock.trail[prevj].underGround || !rock.trail[j].underGround) {
							var vec = {x:rock.trail[j].x-rock.trail[prevj].x, y:rock.trail[j].y-rock.trail[prevj].y};
							context.lineTo((rock.trail[prevj].x+vec.x*0.33-vec.y*0.5 - camera.x)*worldScale, (rock.trail[prevj].y+vec.y*0.33+vec.x*0.5 - camera.y)*worldScale);
							context.lineTo((rock.trail[prevj].x+vec.x*0.66+vec.y*0.5 - camera.x)*worldScale, (rock.trail[prevj].y+vec.y*0.66-vec.x*0.5 - camera.y)*worldScale);
						}
						context.lineTo((rock.trail[j].x - camera.x)*worldScale, (rock.trail[j].y - camera.y)*worldScale);
						context.stroke();
					}
				}
			}
			first = false;
		}
	ticker ++;

	if (endGame) {
		var textToDisplay = (leftInGameTime/1000).toFixed(0);
		var textMeasurements = context.measureText(textToDisplay);

		context.font = "100px ostrich-black";
		context.fillStyle = rocks[0].colour;
		context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5);

		context.font = "100px ostrich-bold";
		context.fillStyle = "#000000";
		context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5);

		if (georgeMode && rocks[0].originalNumber === numberOfRocks-1) {
			textToDisplay = "Happy Birthday";

			textMeasurements = context.measureText(textToDisplay);

			context.font = "100px ostrich-black";
			context.fillStyle = rocks[0].colour;
			context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5 - 210);

			context.font = "100px ostrich-bold";
			context.fillStyle = "#000000";
			context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5 - 210);


			textToDisplay = "George!";
			textMeasurements = context.measureText(textToDisplay);

			context.font = "100px ostrich-black";
			context.fillStyle = rocks[0].colour;
			context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5 - 120);

			context.font = "100px ostrich-bold";
			context.fillStyle = "#000000";
			context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5 - 120);
		} else {
			textToDisplay = winnerText + " wins!";
			textMeasurements = context.measureText(textToDisplay);

			context.font = "100px ostrich-black";
			context.fillStyle = rocks[0].colour;
			context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5 - 150);

			context.font = "100px ostrich-bold";
			context.fillStyle = "#000000";
			context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5 - 150);
		}
	}
	if (mode === game_start && !doingRaceCountDown && rocksIn >= 2) {
		var textToDisplay = (timeLeftInStart/1000).toFixed(0);
		var textMeasurements = context.measureText(textToDisplay);

		context.font = "100px ostrich-black";
		context.fillStyle = "#ffffff";
		context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5);

		context.font = "100px ostrich-bold";
		context.fillStyle = "#000000";
		context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5);
	}
	if (mode === game_start && doingRaceCountDown) {
		var alpha = raceCountDown/500;
		var textToDisplay = "R A C E !";
		context.font = "102px ostrich-black";
		var textMeasurements = context.measureText(textToDisplay);

//        context.fillStyle = "#ffffff";
		context.fillStyle ="rgba(255,255,255," + alpha + ")";// "#000000";
		context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5);

		context.font = "100px ostrich-bold";
//        context.fillStyle = "#000000";
		context.fillStyle ="rgba(0,0,0," + alpha + ")";// "#000000";
		context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5);
	}
	if (mode === game_start) {
		if (one_player_mode) {
			var textToDisplay = "Single player mode: Press '1' key";

			context.font = "40px ostrich-black";
			var textMeasurements = context.measureText(textToDisplay);

			var alpha = doingRaceCountDown ? raceCountDown/500 : 1;
			context.fillStyle ="rgba(0,0,0," + alpha + ")";
			context.fillRect(canvasSize.x*0.5 - textMeasurements.width*0.5, 10, textMeasurements.width, 45);

			context.font = "40px ostrich-bold";
			context.fillStyle ="rgba(255,255,255," + alpha + ")";
			context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, 50);

		}

		context.font = "60px ostrich-black";
        if (flowerMode) {
            var textToDisplay = "Touch flower when under ground";
        } else {
            var textToDisplay = "Press button when under ground";
        }
		var textMeasurements = context.measureText(textToDisplay);

		var alpha = doingRaceCountDown ? raceCountDown/500 : 1;
		context.fillStyle ="rgba(255,255,255," + alpha + ")";// "#000000";
		context.fillRect(canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5+65, textMeasurements.width, 65);

		context.font = "60px ostrich-bold";
		context.fillStyle ="rgba(0,0,0," + alpha + ")";// "#000000";
		context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5+120);

	if (loopdeloopon) {
			textToDisplay = "Tap to loop de loop";
			textMeasurements = context.measureText(textToDisplay);

	//        context.fillStyle = "#ffffff";
			context.fillStyle ="rgba(255,255,255," + alpha + ")";// "#000000";
			context.fillRect(canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5+135, textMeasurements.width, 65);

	//        context.font = "60px ostrich-black";
	//        context.fillStyle = "#ffffff";
	//        context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5+190);

			context.font = "60px ostrich-bold";
	//        context.fillStyle = "#000000";
			context.fillStyle ="rgba(0,0,0," + alpha + ")";// "#000000";
			context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5+190);
	}
	}

}

function toScreenSpace(point) {
	return {x:(point.x-camera.x)*worldScale, y:(point.y - camera.y)*worldScale};
}

function restrictToLevel(rock) {
	if (rock.x < 0) {
		rock.x = 0;
		rock.acceleration.x = 0;
		rock.velocity.x = 0;
	}
	if (rock.x > levelSize.x) {
		rock.x = levelSize.x;
		rock.acceleration.x = 0;
		rock.velocity.x = 0;
	}
	if (rock.y < 0) {
		//    rock.y = 0;
		//    rock.acceleration.y = 0;
		//    rock.velocity.y = 0;
	}
	if (rock.y > levelSize.y) {
		rock.y = levelSize.y;
		rock.acceleration.y = 0;
		rock.velocity.y = 0;
	}
}

function isBelowGround(position) {
	var groundPoint = position.x / pointSpacing;
	var x1 = Math.floor(groundPoint);
	var x2 = Math.ceil(groundPoint);
	var h;
	if (x1 == x2) {
		h = ground[x1].y;
	} else {
		var y1 = ground[x1].y;
		var y2 = ground[x2].y;
		var d = (groundPoint - x1) / (x2 - x1);
		h = y1 * d + y2 * (1-d);
	}
	if (position.y > h) return position.y-h;
	else return 0;
}

function pressMe(i) {
	keys[rockMap[i].onKey] = true;
}
function unPressMe(i) {
	keys[rockMap[i].onKey] = false;
}

window.onload = init;
