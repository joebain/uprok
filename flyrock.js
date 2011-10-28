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
var groundPoints = 30000;
var levelSize = {x:groundPoints*pointSpacing, y:screenSize.y * 3};

var numberOfPowers = 100;
var powers = [];
var powerSize = 300;
var powerSpacing;
var powerOffset = 0;

var cameraTracking = 0.2;
var cameraZooming = 0.1;
var cameraBorder = 0.1;
var minWorldScale = 0.15;
var maxWorldScale = 0.7;
var cameraAhead = 0.1;

var worldScale = 1;
var desiredWorldScale = 1;
var ticker = 0;
var rockTrailPointer = 0;
var rockTrailLength = 20;
var rockTrailInterval = 2;

var rocks = [];

var keys = {};

var lastTime = new Date().getTime();
var thisTime = 0;
var delta = 0;
var interval = 0;
var targetInterval = 17;

var mode;
var game_start = 1;
var game_play = 2;
var game_end = 3;

var pause = false;

var startMessage;
var startCountElement;

function init() {
  var canvas = document.getElementById("canvas");
  //    canvas.style.height = screenSize.y*worldScale;
  //    canvas.style.width = screenSize.x*worldScale;
  //    canvas.style.top = (window.innerHeight-screenSize.y*worldScale)/2;
  //    canvas.style.left = (window.innerWidth-screenSize.x*worldScale)/2;

  context = canvas.getContext("2d");

  window.onkeydown = keysdown;
  window.onkeyup = keysup;

  startMessage = document.getElementById("startMessage");
  startCountElement = document.getElementById("startCount");

  for (var i = 0 ; i < 6 ; i++) {
    rocks[i] = {};
    rocks[i].x = pointSpacing * 2;
    rocks[i].y = 300;
    rocks[i].size = 10;
    rocks[i].velocity = {x:0, y:0};
    rocks[i].acceleration = {x:0, y:0};
    rocks[i].x = 0;
    rocks[i].y = 0;
    rocks[i].maxVelocity = 0;
    rocks[i].force = {x:0, y:0};
    rocks[i].trail = [];
    rocks[i].speedDivId = "player" + (i+1) + "speed";
    rocks[i].scoreDivId = "player" + (i+1) + "score";
    rocks[i].actionDivId = "player" + (i+1) + "action";
    rocks[i].startLogoElement = document.getElementById("startLogo"+(i+1));
  }

  rocks[0].onKey = 90;//z
  rocks[1].onKey = 67;//c
  rocks[2].onKey = 88;//x
  rocks[3].onKey = 78;//n
  rocks[4].onKey = 66;//b
  rocks[5].onKey = 77;//m

  rocks[0].colour = "#d82095";
  rocks[1].colour = "#99df19";
  rocks[2].colour = "#0cc4ec";
  rocks[3].colour = "#fa611e";
  rocks[4].colour = "#710bf6";
  rocks[5].colour = "#dcc20d";

  for (var i in rocks) {
    rocks[i].elementSpeed = document.getElementById(rocks[i].speedDivId);
    rocks[i].elementSpeed.style.color = rocks[i].colour;
    rocks[i].elementScore = document.getElementById(rocks[i].scoreDivId);
    rocks[i].elementAction = document.getElementById(rocks[i].actionDivId);
    rocks[i].elementAction.style.backgroundColor = rocks[i].colour;
  }

  change_state(game_start);

  loop();
}

function startingGrid() {
  for (var i in rocks) {
    var rock = rocks[i];
    rock.x = i * 40 + 100;
    rock.y = 400;
    rock.velocity = {x:0, y:0};
    rock.acceleration = {x:0, y:0};
    rock.trail = [];
    rock.force = {x:0, y:0};
    rock.maxVelocity = 0;
    rock.in = false;
    rock.on = false;
//    rock.startLogoElement.style.visibility = "hidden";
  }
  rocksIn = 0;

// make the level

  var y = 400;
  var x = 0;
  var yVel = 0;
  var maxYVel = 1;
  var borderY = 300;
  for (var i = 0 ; i <= groundPoints ; i++) {
    maxYVel = i /500 + 1;
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

  powerSpacing = levelSize.x / numberOfPowers;
  for (var i = 0 ; i < numberOfPowers ; i++) {
    powers[i] = {x:(i+powerOffset)*powerSpacing+powerSpacing*Math.random(), y:(Math.random()+0.25)*levelSize.y*0.5, taken:false};
  }

}

function keysup(e) {
  keys[e.keyCode] = false;
}

function keysdown(e) {
  keys[e.keyCode] = true;
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

  for (var i in rocks) {
    var rock = rocks[i];
    if (keys[rock.onKey]) {
      if (!rock.in) {
        rocksIn++
        rock.in = true;
//        rock.startLogoElement.style.visibility = "visible";
        rock.startLogoElement.style.color = rock.colour;
      }
    }
  }
  startCountElement.innerHTML = Math.ceil(timeLeftInStart/1000);

  if (rocksIn >= 1) {
    timeLeftInStart -=delta;
  }
  if (doingRaceCountDown) {
    var startMessageHeight = startMessage.style.height;
//    if (startMessageHeight === "") {
//      startMessage.style.height = 250;
//    }
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
      flash = 1;
      flashed1 = true;
      for (var i in rocks) {
        rocks[i].on = false;
      }
    }
  }
  else if (timeLeftInStart <= 0 || rocksIn == 6) {
    console.log("starting game");
//    startMessage.style.display = "none";
    camera.y = 300;
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

function setForPlay() {
//  worldScale = 5; // start really big
}

function change_state(new_state) {
  switch (new_state) {
    case game_start:
      startingGrid();
      draw();
      timeLeftInStart = 1000;
      doingRaceCountDown = false;
      timeInStart = 0;
      startMessage.style.display = "block";
      startMessage.style.height = 250;
      break;
    case game_play:
      setForPlay();
      break;
    case game_end:
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
      break;
    case game_play:
      update(delta);
      draw();
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

  for (i in rocks) {
    rock = rocks[i];

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

    // powers
    var p = Math.floor(camera.x/powerSpacing)+powerOffset;
    var lim = Math.ceil((screenSize.x + camera.x)/powerSpacing)+powerOffset;
    var power;
    for ( ; p < lim ; p ++) {
      power = powers[p];
      if ( (power.x - rock.x) * (power.x - rock.x) + (power.y - rock.y) * (power.y - rock.y) < powerSize * powerSize ) {
        power.taken = true;
        power.takenBy = i;
      }
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
    yZoom = (canvasSize.y / (viewRect.top-viewRect.bottom))*(1-cameraBorder);
    zoom = xZoom < yZoom ? yZoom : xZoom;
    tooFar = scaleWorld(zoom);

    if (tooFar && slowest) {
      //someone is out
      removeRock(slowest);
      console.log("booting out " + slowest);
    }
  }

}

function removeRock(i) {
  rocks[i].elementSpeed.innerHTML = "Out";
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
    context.lineTo((ground[i].x - camera.x)*worldScale, ((levelSize.y - ground[i].y) - camera.y)*worldScale);
  }
  context.lineTo(levelSize.x*worldScale+1000, levelSize.y*worldScale+1000);
  context.closePath();
  context.fill();

  context.lineWidth = 20*worldScale;
  i = Math.floor(camera.x/powerSpacing)+powerOffset;
  lim = Math.ceil((screenSize.x + camera.x)/powerSpacing)+powerOffset;
  var power;
  for (; i < lim ; i++) {
    power = powers[i];

    context.strokeStyle = "rgba(0,0,0,1)";
    context.beginPath();
    context.arc((power.x - camera.x)*worldScale, (power.y - camera.y)*worldScale, powerSize*worldScale, 0, Math.PI*2, true);
    context.stroke();

    context.strokeStyle = "rgba(0,0,0,1)";
    context.beginPath();
    context.arc((power.x - camera.x)*worldScale, (power.y - camera.y)*worldScale, powerSize*0.9*worldScale, 0, Math.PI*2, true);
    context.stroke();

    if (power.taken) {
      context.strokeStyle = rocks[power.takenBy].colour;
    } else {
      context.strokeStyle = "rgba(255,255,255,1)";
    }
    context.beginPath();
    context.arc((power.x - camera.x)*worldScale, (power.y - camera.y)*worldScale, powerSize*0.95*worldScale, 0, Math.PI*2, true);
    context.stroke();
  }

  for (var i in rocks) {
    var rock = rocks[i];
    if (!rock.in) return;
    context.strokeStyle ="rgba(0,0,0," + (1-flash) + ")";// "#000000";
    context.fillStyle ="rgba(0,0,0," + (1-flash) + ")";// "#000000";
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
      rock.elementSpeed.innerHTML = (rock.velocity.x*100).toFixed(2) + " mph";
      rock.elementScore.innerHTML = (rock.maxVelocity*100).toFixed(2) + " mph";

    }

    context.strokeStyle = rock.colour;
    context.lineWidth = rock.size*0.5*worldScale;
    context.beginPath();
    var j;
    var first = false;
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
