var context;
var audioContext;

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
var minRockYVelocity = 50;

var camera = {x:0, y:0};
var desiredCamera = {x:0, y:0};
var pointSpacing = 10;
var pointHeight = 30;
var screenSize = {x:2560, y:1600};
var canvasSize = {x:1280, y:800};
var groundPoints = 300000;
var levelSize = {x:groundPoints*pointSpacing, y:screenSize.y * 1000};

var cameraTracking = 0.2;
var cameraZooming = 0.1;
var cameraBorder = 0.15;
var minWorldScale = 0.2;
var maxWorldScale = 0.7;
var cameraAhead = 0.1;

var worldScale = 1;
var desiredWorldScale = 1;
var ticker = 0;
var rockTrailPointer = 0;
var rockTrailLength = 20;
var rockTrailInterval = 2;
var rockMinSize = 10;
var maxRockSpeed = 0;
var rocktrailWidth = 0.06;
var terminalYVel = 10;

var rocks = [];
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
var playerCountDown = 1000;
var endGame = false;
var leftInGameTime = 0;
var gameIsLocal = true;

var mode;
var game_start = 1;
var game_play = 2;
var game_end = 3;

var pause = false;
var manualControl = false;

var startMessage;
var startCountElement;
var startCountElementTwo;

var gameChoiceDiv;
var gameChoiceLocal;
var gameChoiceRemote;
var playerChoiceDiv;
var playerChoice = {};

var socket;

var drums = [];

function init() {
	var canvas = document.getElementById("canvas");
	//    canvas.style.height = screenSize.y*worldScale;
	//    canvas.style.width = screenSize.x*worldScale;
	//    canvas.style.top = (window.innerHeight-screenSize.y*worldScale)/2;
	//    canvas.style.left = (window.innerWidth-screenSize.x*worldScale)/2;

	context = canvas.getContext("2d");

	window.onkeydown = keysdown;
	window.onkeyup = keysup;
	window.onmousemove = mousemove;

	startMessage = document.getElementById("startMessage");
	startCountElement = document.getElementById("startCount");
	startCountElementTwo = document.getElementById("startCountTwo");


	gameChoiceDiv = document.getElementById("gameChoice");
	gameChoiceLocal = document.getElementById("localChoice");
	gameChoiceLocal.onclick = chooseLocal;
	gameChoiceRemote = document.getElementById("remoteChoice");
	gameChoiceRemote.onclick = chooseRemote;

	playerChoiceDiv = document.getElementById("playerNumberChoice");
	for (var i = 1 ; i <= numberOfRocks ; i++) {
		playerChoice[i] = document.getElementById(i+"player");
		(function(i) {
			playerChoice[i].onclick = function() {choosePlayers(i);}
		})(i);
	}

	socket = io.connect('http://127.0.0.1:1337');
	socket.on('updatePlayers', updatePlayers);
	socket.on('confirmPlayers', confirmPlayers);
	socket.on('gameStart', gameStart);
	socket.on('gameFinished', gameFinished);
	socket.on('news', handleNews);




	change_state(game_start);

	loop();
}

function gameStart(data) {
}
function gameFinished(data) {
}
function handleNews(data) {
}

function chooseRemote() {
	console.log("remote game");
	gameChoiceDiv.style.display = "none";
	playerChoiceDiv.style.display = "";
	gameIsLocal = false;
}
function chooseLocal() {
	console.log("local game");
	gameChoiceDiv.style.display = "none";
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
	rock.startLogoElement.style.color = "#ffffff";
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

function playSound(soundObj) {
	if (soundObj.playing) return;

	soundObj.gainNode = audioContext.createGainNode();
	soundObj.gainNode.gain.value = 1.0;
	soundObj.gainNode.connect(audioContext.destination);

	soundObj.filterNode = audioContext.createBiquadFilter();
	soundObj.filterNode.type = 0;
	soundObj.filterNode.Q.value = 12;
	soundObj.filterNode.frequency.value = 126;
	soundObj.filterNode.connect(soundObj.gainNode);

	soundObj.node = audioContext.createBufferSource();
	soundObj.node.loop = true;
	soundObj.node.buffer = soundObj.buffer;
	soundObj.node.connect(soundObj.filterNode);
    soundObj.node.noteOn(0);

	soundObj.playing = true;
	soundObj.playingTimeout = setTimeout(Math.round(soundObj.buffer.seconds*1000), function(){soundObj.playing=false;});
}

function stopSound(soundObj) {
	if (!soundObj.playing) return;
	if (soundObj.playingTimeout) clearTimeout(soundObj.playingTimeout);
	soundObj.node.noteOff(0);
	soundObj.playing = false;
}

function muteSound(soundObj) {
	soundObj.gainNode.gain.value = 0.0;
}

function unMuteSound(soundObj) {
	soundObj.gainNode.gain.value = 1.0;
}

function filterSound(soundObj) {
}

function startAllSounds() {
	for (var i in rocks) {
		playSound(rocks[i].sound);
		muteSound(rocks[i].sound);
		playSound(rocks[i].sparseSound);
		muteSound(rocks[i].sparseSound);
	}
	playSound(drums[0]);
}

function loadSounds() {
	audioContext = new webkitAudioContext();

	var gotten = 0;

	drums = [];
	drums.push({url:"sounds/drums_heavy.ogg"});
	//drums.push({url:"sounds/behind_the_wall_of_sleep.ogg"});


	for (var i in drums) {
		var drum = drums[i];
		getSound(drum, function(){gotten++; if (gotten == 11) startAllSounds();});
	}
	
	rocks[0].sound = {url:"sounds/track1_heavy.ogg"};
	rocks[1].sound = {url:"sounds/track2_heavy.ogg"};
	rocks[2].sound = {url:"sounds/track3_heavy.ogg"};
	rocks[3].sound = {url:"sounds/track4_heavy.ogg"};
	rocks[4].sound = {url:"sounds/track5_heavy.ogg"};
	rocks[0].sparseSound = {url:"sounds/track1_sparse.ogg"};
	rocks[1].sparseSound = {url:"sounds/track2_sparse.ogg"};
	rocks[2].sparseSound = {url:"sounds/track3_sparse.ogg"};
	rocks[3].sparseSound = {url:"sounds/track4_sparse.ogg"};
	rocks[4].sparseSound = {url:"sounds/track5_sparse.ogg"};
	for (var i in rocks) {
		var rock = rocks[i];
		getSound(rock.sound, function(){gotten++; if (gotten == 11) startAllSounds();});
		getSound(rock.sparseSound, function(){gotten++; if (gotten == 11) startAllSounds();});
	}
}

function startingGrid() {
	for (var i = 0 ; i < numberOfRocks ; i++) {
		rocks[i] = {};
		rocks[i].x = pointSpacing * 2;
		rocks[i].y = 300;
		rocks[i].size = rockMinSize;
		rocks[i].velocity = {x:0, y:0};
		rocks[i].acceleration = {x:0, y:0};
		rocks[i].x = 0;
		rocks[i].y = 0;
		rocks[i].maxVelocity = 0;
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
		rockMap[i] = rocks[i];
	}

	rocks[0].onKey = 90;//z
	rocks[1].onKey = 67;//c
	rocks[2].onKey = 88;//x
	rocks[3].onKey = 78;//n
	rocks[4].onKey = 66;//b
//	rocks[5].onKey = 77;//m

	rocks[0].colour = "#d82095";
	rocks[1].colour = "#99df19";
	rocks[2].colour = "#0cc4ec";
	rocks[3].colour = "#fa611e";
	rocks[4].colour = "#710bf6";
//	rocks[5].colour = "#dcc20d";

	for (var i in rocks) {
		rocks[i].elementSpeed = document.getElementById(rocks[i].speedDivId);
		rocks[i].elementSpeed.style.color = rocks[i].colour;
		rocks[i].elementScore = document.getElementById(rocks[i].scoreDivId);
		rocks[i].elementAction = document.getElementById(rocks[i].actionDivId);
		rocks[i].elementAction.style.backgroundColor = rocks[i].colour;

		var rock = rocks[i];
		rock.x = i * 40 + 100;
		rock.y = levelSize.y - 800;
		rock.velocity = {x:0, y:0};
		rock.acceleration = {x:0, y:0};
		rock.trail = [];
		rock.force = {x:0, y:0};
		rock.maxVelocity = 0;
		rock.in = false;
		rock.on = false;
		rock.weight = 1;
		rock.startLogoElement.style.color = "#000000";
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

	//show/hide options
	gameChoiceDiv.style.display = "";
	playerChoiceDiv.style.display = "none";
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
		rocksIn++;
		rock.in = true;
		rock.local = local;
		if (local && !gameIsLocal) {
			initRemote(rock);
		}
		rock.startLogoElement.style.color = rock.colour;
	}
}

function controlSound() {
	if (keys[80]) { // p
		playSound(drums[0]);
		for (var i in rocks) {
			if (rocks[i].sound) {
				playSound(rocks[i].sound);
				playSound(rocks[i].sparseSound);
			}
		}
	}
	if (keys[79]) { //o
		stopSound(drums[0]);
		for (var i in rocks) {
			if (rocks[i].sound) {
				stopSound(rocks[i].sound);
				stopSound(rocks[i].sparseSound);
			}
		}
	}
	if (keys[73]) { //i
		muteSound(drums[0]);
	}
	if (keys[85]) { //u
		unMuteSound(drums[0]);
	}
//	if (drums[0] && drums[0].playing) {
//		var mouseXVal = (mousePos.x/window.innerWidth);
//		mouseXVal /= 2;
//		mouseXVal += 0.5;
//		drums[0].filterNode.frequency.value = Math.pow(2, mouseXVal*10);
//		drums[0].filterNode.Q.value = ((mousePos.y/window.innerHeight)-0.5) * 40;
//	}
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
		if (keys[rock.onKey] && rock.local) {
			joinRock(i, true);
			if (rock.sound && rock.sparseSound) {
				unMuteSound(rock.sparseSound);
			}
		}
	}

	if (rocksIn >= 2) {
		timeLeftInStart -=delta;
		startCountElement.innerHTML = Math.ceil(timeLeftInStart/1000);
		startCountElementTwo.innerHTML = Math.ceil(timeLeftInStart/1000);
	}
	if (doingRaceCountDown) {
		var startMessageHeight = startMessage.style.height;
		startMessageHeight = parseInt(startMessageHeight);
		if (startMessageHeight <= 30) {
			startMessage.style.display = "none";
		} else {
			startMessage.style.height = startMessageHeight-30;//delta*0.5;
			console.log("height: " + startMessage.style.height);
		}
		raceCountDown -= delta;
		if (raceCountDown <= 0) {
			change_state(game_play);
		} else if (raceCountDown <= 2000 && !flashed2) {
			flash = 1;
			flashed2 = true;
			for (var i in rocks) {
				rocks[i].on = true;
			}
		} else if (raceCountDown <= 1000 && !flashed1) {
			playSound(drums[0]);
			flash = 1;
			flashed1 = true;
			for (var i in rocks) {
				rocks[i].on = false;
			}
		}
	}
	else if (timeLeftInStart <= 0 || rocksIn == numberOfRocks) {
		console.log("starting game");
		//    startMessage.style.display = "none";
		camera.y = levelSize.y - 900;
		desiredCamera.y = levelSize.y - 900;
		worldScale = 2;
		raceCountDown = 3000;
		doingRaceCountDown = true;
		flashed1 = false;
		flashed2 = false;
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
	}
	if (flash > 0) {
		flash = flash - (delta*0.002);
	} else {
		flash = 0;
	}
	draw();

}

var timeInEnd = 0;
function run_end(delta) {
	draw();

	if (startMessage.style.height < 250) {
		startMessage.style.height += 10;
	} else {
		startMessage.style.height = 250;
		change_state(game_start);
	}

}

function setForPlay() {
	//  worldScale = 5; // start really big
}

function change_state(new_state) {
	switch (new_state) {
		case game_start:
			startingGrid();
			draw();
			timeLeftInStart = playerCountDown;
			doingRaceCountDown = false;
			timeInStart = 0;
			startMessage.style.display = "block";
			startMessage.style.height = 250;
			break;
		case game_play:
			setForPlay();
			break;
		case game_end:
			endGame = false;
			startMessage.style.display = "block";
			startMessage.style.height = 0;
			var winnerText = "Someone Won!";
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
					winnerText = "Yellow";
					break;
			}
			startCountElement.innerHTML = winnerText + " Won!";
			startCountElementTwo.innerHTML = winnerText + " Won!";
			startCountElementTwo.style.color = rocks[0].colour;
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
			break;
		case game_play:
			update(delta);
			draw();
			synchronise();
			break;
		case game_end:
			run_end(delta);
			break;
	}
	interval = targetInterval - (new Date().getTime() - thisTime);
	interval = interval < 1 ? 1 : interval;
	setTimeout(loop, interval);
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
var slowest;
var i;
var rock;
function update(delta)
{

	viewRect = {top:Number.MAX_VALUE, bottom:0, left:Number.MAX_VALUE, right:0};

	if (rocks.length == 1) {
		if (!endGame) {
			endGame = true;
			leftInGameTime = 10000;
		}

		leftInGameTime -= delta;

		if (leftInGameTime < 0) {
			change_state(game_end);
		}
	}

	for (i in rocks) {
		rock = rocks[i];

		if (rock.originalNumber == 0) {
			rock.on = false;
		}
		if (keys[rock.onKey]) {//z
			rock.on = true;
			//      rock.weight = 1.5;
		} else {
			//      rock.wight = 1;
		}

		controlSound();

		restrictToLevel(rock);
		rock.underGround = isBelowGround(rock);
		//if (Math.random() > 0.99999999999) {
		if (rock.originalNumber != 0) {
			if (ticker % 10 == 0) {
				rock.on = rock.underGround;
			}
		}

		rock.force.y = (rock.velocity.y/rock.weight)/delta;
		rock.force.x = (rock.velocity.x/rock.weight)/delta;

		//acceleration

		rock.acceleration.x = 0;
		rock.acceleration.y = gravity;
		if (rock.underGround) {
			rock.acceleration.x += -rock.force.x * groundFriction.x;
			// attempt to stop the skimming that often happens at the start
			//      if (rock.underGround < 10 && rock.velocity.y > 0 && rock.velocity.y < gravity*0.5) {
			//        rock.acceleration.y += gravity;
			//      } else
			if (Math.abs(rock.velocity.y) > minRockYVelocity) {
				rock.acceleration.y += -rock.force.y * groundFriction.y;
			}
			rock.acceleration.y += -groundForce;
			if (rock.on) {
				rock.acceleration.x += rockJumpGroundAcceleration.x*rock.speed;
				rock.acceleration.y -= rockJumpGroundAcceleration.y;
			}
		} else {
			if (rock.on) {
				rock.acceleration.x -= rock.force.x * heavyAirFriction*rock.speed;
			}
			rock.acceleration.y -= rock.force.y * airFriction;
		}

		// velocity

		//    if (rock.velocity.y < terminalYVel) rock.velocity.y = terminalYVel;
		rock.velocity.y += rock.acceleration.y * delta;
		rock.velocity.x += rock.acceleration.x * delta;
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

		if (rock.velocity.x > rock.maxVelocity) rock.maxVelocity = rock.velocity.x;
		

		//sounds
		if (rock.sound && rock.sound.playing) {
			//var mouseXVal = (mousePos.x/window.innerWidth);
			//var freq = rock.velocity.x / rock.maxVelocity;
			var freq = -rock.velocity.y / 50 + 0.5;
			freq /= 2;
			freq += 0.5;
			rock.sound.filterNode.frequency.value = Math.pow(2, freq*10);
			//rock.sound.filterNode.Q.value = rock.underGround ? 20 : -20;

			if (rock.on && rock.in) {
				unMuteSound(rock.sound);
				muteSound(rock.sparseSound);
			} else {
				muteSound(rock.sound);
				unMuteSound(rock.sparseSound);
			}
		}

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
		if (rock.on) {
			rock.trail[rockTrailPointer] = {x:rock.x, y:rock.y};
		}
	}

	if (ticker % 5 == 0) {
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

		scaleWorld(0.5/rocks[0].velocity.x);
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
		drums[0].filterNode.frequency
		var filterVal = (xZoom-minWorldScale)/(maxWorldScale-minWorldScale);
		if (filterVal < 0)filterVal = 0;
		if (filterVal > 1)filterVal = 1;
		filterVal = 1-filterVal;
		console.log(filterVal);
		filterVal /= 3;
		filterVal += 0.66;
		drums[0].filterNode.frequency.value = Math.pow(2, filterVal*10);

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
	rocks[i].elementSpeed.innerHTML = "Out";
	muteSound(rocks[i].sound);
	unMuteSound(rocks[i].sparseSound);
	rocks.splice(i,1);
}

function draw() {
	if (mode == game_play) {
		worldScale = worldScale*(1-cameraZooming) + desiredWorldScale*cameraZooming;

		camera.x = camera.x*(1-cameraTracking) + desiredCamera.x*cameraTracking;
		camera.y = camera.y*(1-cameraTracking) + desiredCamera.y*cameraTracking;
	}
	screenSize.x = canvasSize.x / worldScale;
	screenSize.y = canvasSize.y / worldScale;

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
		if (!rock.in) return;
		context.strokeStyle ="rgba(0,0,0," + (1-flash) + ")";// "#000000";
		context.fillStyle ="rgba(0,0,0," + (1-flash) + ")";// "#000000";
		context.beginPath();
		context.arc((rock.x - camera.x)*worldScale, (rock.y - camera.y)*worldScale, rockMinSize*worldScale, 0, Math.PI*2, true);
		context.fill();

		if (rock.on) {
			context.strokeStyle = "#000000";
			context.fillStyle = rock.colour;
			context.beginPath();
			context.arc((rock.x - camera.x)*worldScale, (rock.y - camera.y)*worldScale, (rockMinSize*0.5)*worldScale, 0, Math.PI*2, true);
			context.fill();
		}


		if (ticker%5 == 0) {
			rock.elementSpeed.innerHTML = (rock.velocity.x*100).toFixed(2) + " mph";
			rock.elementScore.innerHTML = (rock.maxVelocity*100).toFixed(2) + " mph";

		}

//		context.strokeStyle = "#000000";
//		context.lineWidth = rock.size*rockMinSize*rocktrailWidth*worldScale*3;
//		context.beginPath();
//		var j;
//		var first = false;
//		context.moveTo((rock.x - camera.x)*worldScale, (rock.y - camera.y)*worldScale);
//		for (var i = 0 ; i < rockTrailLength ; i++) {
//			j = ((rockTrailPointer-i)+rockTrailLength)%rockTrailLength;
//			if (rock.trail[j]) {
//				if (first) {
//					context.moveTo((rock.trail[j].x - camera.x)*worldScale, (rock.trail[j].y - camera.y)*worldScale);
//					first = false;
//				} else {
//					context.lineTo((rock.trail[j].x - camera.x)*worldScale, (rock.trail[j].y - camera.y)*worldScale);
//				}
//			} else {
//				first = true;
//			}
//		}
//		context.stroke();
		context.strokeStyle = rock.colour;
		context.lineWidth = rock.size*rockMinSize*rocktrailWidth*worldScale;
		context.beginPath();
		first = false;
		context.moveTo((rock.x - camera.x)*worldScale, (rock.y - camera.y)*worldScale);
		for (var i = 0 ; i < rockTrailLength ; i++) {
			j = ((rockTrailPointer-i)+rockTrailLength)%rockTrailLength;
			if (rock.trail[j]) {
				if (first) {
					context.moveTo((rock.trail[j].x - camera.x)*worldScale, (rock.trail[j].y - camera.y)*worldScale);
					first = false;
				} else {
					context.lineTo((rock.trail[j].x - camera.x)*worldScale, (rock.trail[j].y - camera.y)*worldScale);
				}
			} else {
				first = true;
			}
		}
		context.stroke();

	}
	ticker ++;

	if (endGame) {
		context.font = "100px ostrich-bold";
		var textToDisplay = (leftInGameTime/1000).toFixed(0);
		var textMeasurements = context.measureText(textToDisplay);
		context.fillStyle = "#000000";
		context.fillText(textToDisplay, canvasSize.x*0.5 - textMeasurements.width*0.5, canvasSize.y*0.5-50);
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
