var context;

var ground = [];

var Vector2f = function(x, y) {
	this.x = x;
	this.y = y;
	return this;
}
var gravity = 0.004;
var groundForce = 0.008;
var groundFriction = {x:0.02, y:0.01};
var heavyAirFriction = 0.02;
var rockJumpGroundAcceleration = {x:0.003, y:0.001};
var minRockYVelocity = 1;

var camera = {x:0, y:0};
var desiredCamera = {x:0, y:0};
var pointSpacing = 10;
var pointHeight = 30;
var screenSize = {x:1600, y:800};
var canvasSize = {x:800, y:400};
var groundPoints = 10000;
var levelSize = {x:groundPoints*pointSpacing, y:screenSize.y * 3};
var cameraTracking = 0.1;
var cameraZooming = 0.05;

var worldScale = 0.5;
var desiredWorldScale = 0.5;
var ticker = 0;

var rocks = [];

var keys = {};

var lastTime = new Date().getTime();
var thisTime = 0;
var delta = 0;
var interval = 0;
var targetInterval = 17;

function init() {
	var canvas = document.getElementById("canvas");
//    canvas.style.height = screenSize.y*worldScale;
//    canvas.style.width = screenSize.x*worldScale;
//    canvas.style.top = (window.innerHeight-screenSize.y*worldScale)/2;
//    canvas.style.left = (window.innerWidth-screenSize.x*worldScale)/2;

    context = canvas.getContext("2d");

	window.onkeydown = keysdown;
	window.onkeyup = keysup;

	var y = 400;
	var x = 0;
	var yVel = 0;
	var maxYVel = 1;
	var borderY = 300;
	for (var i = 0 ; i <= groundPoints ; i++) {
		maxYVel = i /500 + 5;
		if (maxYVel > 30) maxYVel = 30;
		var newy;
		do {
			yVel += (Math.random()-0.5)*(maxYVel);
			if (yVel > maxYVel) yVel = maxYVel;
			if (yVel < -maxYVel) yVel = -maxYVel;
			newy = y + yVel;
			if (y < borderY || y > levelSize.y-borderY) yVel = 0;
		} while (newy < borderY || newy > levelSize.y-borderY);
		y = newy;
		x = i * pointSpacing;
		ground[i] = new Vector2f(x,y);
	}

	for (var i = 0 ; i < 4 ; i++) {
		rocks[i] = {};
		rocks[i].x = pointSpacing * 2;
		rocks[i].y = 300;
		rocks[i].size = 10;
		rocks[i].velocity = {x:0, y:0};
		rocks[i].acceleration = {x:0, y:0};
		rocks[i].x = 0;
		rocks[i].rotation = 0;
		rocks[i].y = 0;
		rocks[i].maxVelocity = 0;
    rocks[i].force = {x:0, y:0};
	}

	rocks[0].onKey = 90;//z
	rocks[1].onKey = 38;//up
	rocks[2].onKey = 32;//space
	rocks[3].onKey = 81;//q

	rocks[0].colour = "#ff0000";
	rocks[1].colour = "#00ff00";
	rocks[2].colour = "#00ffff";
	rocks[3].colour = "#ffff00";

	rocks[0].speedDivId = "player1speed";
	rocks[0].scoreDivId = "player1score";
	rocks[1].speedDivId = "player2speed";
	rocks[1].scoreDivId = "player2score";
	rocks[2].speedDivId = "player3speed";
	rocks[2].scoreDivId = "player3score";
	rocks[3].speedDivId = "player4speed";
	rocks[3].scoreDivId = "player4score";

	for (var i in rocks) {
		rocks[i].elementSpeed = document.getElementById(rocks[i].speedDivId);
		rocks[i].elementSpeed.style.color = rocks[i].colour;
		rocks[i].elementScore = document.getElementById(rocks[i].scoreDivId);
	}

  loop();
}

function keysup(e) {
	keys[e.keyCode] = false;
}

function keysdown(e) {
	keys[e.keyCode] = true;
}

function loop() {
  thisTime = new Date().getTime();
  delta = thisTime-lastTime;
  lastTime = thisTime;
  update(delta);
  draw();

  interval = targetInterval - (new Date().getTime() - thisTime);
  interval = interval < 1 ? 1 : interval;
  setTimeout(loop, interval);
}

function scaleWorld(scale)
{
	var tooFar = false;
	if (scale < 0.2) {
		tooFar = true;
		scale = 0.2;
	}
	if (scale > 1.2) {
		scale = 1.2;
	}
	desiredWorldScale = scale * 0.8;

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

function update(delta)
{
	var viewRect = {top:0, bottom:Number.MAX_VALUE, left:Number.MAX_VALUE, right:0};
	var slowest;
	for (var i in rocks) {
		var rock = rocks[i];
		
    rock.on = false;
		if (keys[rock.onKey]) {//z
			rock.on = true;
		}
		
		restrictToLevel(rock);
		rock.underGround = isBelowGround(rock);
   
    rock.force.y = rock.velocity.y/delta;
    rock.force.x = rock.velocity.x/delta;
    
    //acceleration
  
    rock.acceleration.x = 0;
    rock.acceleration.y = gravity;
    if (rock.underGround) {
			rock.acceleration.x += -rock.force.x * groundFriction.x;
      if (Math.abs(rock.velocity.y) > minRockYVelocity) {
			  rock.acceleration.y += -rock.force.y * groundFriction.y;
      }
      rock.acceleration.y += -groundForce;
      if (rock.on) {
				rock.acceleration.x += rockJumpGroundAcceleration.x;
				rock.acceleration.y -= rockJumpGroundAcceleration.y;
      }
    } else {
      if (rock.on) {
        rock.acceleration.x = -rock.force.x * heavyAirFriction;
      }
    }

    // velocity

		rock.velocity.y += rock.acceleration.y * delta;
		rock.velocity.x += rock.acceleration.x * delta;
		rock.y += rock.velocity.y * delta;
		rock.x += rock.velocity.x * delta;

		if (rock.velocity.x > rock.maxVelocity) rock.maxVelocity = rock.velocity.x;

		restrictToLevel(rock);
    if ( rock.y > viewRect.top ) viewRect.top = rock.y;
    if ( rock.y < viewRect.bottom ) viewRect.bottom = rock.y;
		if ( rock.x < viewRect.left ) {
			slowest = i;
			viewRect.left = rock.x;
		}
		if ( rock.x > viewRect.right ) viewRect.right = rock.x;
	}

	if (rocks.length == 1) {
    panCamera(rocks[0].x - screenSize.x/4, rocks[0].y - screenSize.y/2);
		
		scaleWorld(0.5/rocks[0].velocity.x);
	} else {
    panCamera((viewRect.left + viewRect.right) /2 - screenSize.x/2, (viewRect.top + viewRect.bottom) /2 - screenSize.y/2);

		var tooFar = scaleWorld(canvasSize.x / (viewRect.right-viewRect.left));

		if (tooFar && slowest) {
			//someone is out
      console.log("booting out " + slowest);
			rocks[slowest].elementSpeed.innerHTML = "Lose!";
			rocks.splice(slowest,1);
		}
	}

}

function draw() {
	worldScale = worldScale*(1-cameraZooming) + desiredWorldScale*cameraZooming;
	screenSize.x = canvasSize.x / worldScale;
	screenSize.y = canvasSize.y / worldScale;

	context.fillStyle="#ffffff";
	context.fillRect(0,0,screenSize.x*worldScale, screenSize.y*worldScale);

  camera.x = camera.x*(1-cameraTracking) + desiredCamera.x*cameraTracking;
  camera.y = camera.y*(1-cameraTracking) + desiredCamera.y*cameraTracking;


	var i = Math.floor(camera.x/pointSpacing);
	var lim = Math.ceil((screenSize.x + camera.x)/pointSpacing);
  if (lim >= groundPoints) lim = groundPoints-1;
	context.strokeStyle = "#000000";
	context.fillStyle = "#000000";
	context.strokeWidth = 5;
	context.beginPath();
	context.lineTo(0,levelSize.y*worldScale);
	for (; i <= lim; i++) {
		context.lineTo((ground[i].x - camera.x)*worldScale, ((levelSize.y - ground[i].y) - camera.y)*worldScale);
	}
	context.lineTo(levelSize.x*worldScale, levelSize.y*worldScale);
	context.closePath();
	context.fill();


	for (var i in rocks) {
		var rock = rocks[i];
		context.strokeStyle = "#000000";
		context.fillStyle = "#000000";
		context.beginPath();
		context.arc((rock.x - camera.x)*worldScale, (rock.y - camera.y)*worldScale, rock.size*worldScale, 0, Math.PI*2, true);
		context.fill();

		if (rock.on) {
			context.strokeStyle = "#000000";
			context.fillStyle = rock.colour;
			context.beginPath();
			context.arc((rock.x - camera.x)*worldScale, (rock.y - camera.y)*worldScale, (rock.size*0.5)*worldScale, 0, Math.PI*2, true);
			context.fill();
		}


		if (ticker%5 == 0) {
			rock.elementSpeed.innerHTML = (rock.velocity.x*100).toFixed(2) + " mp/h";
			rock.elementScore.innerHTML = (rock.maxVelocity*100).toFixed(2) + " mp/h";
		}
	}
	ticker ++;

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
	if (position.y > (levelSize.y - h)) return true;
	else return false;
}

function pressMe(i) {
	keys[rocks[i].onKey] = true;
}
function unPressMe(i) {
	keys[rocks[i].onKey] = false;
}

window.onload = init;
