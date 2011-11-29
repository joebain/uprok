var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');
var socket_io = require('socket.io');

var games = [];
var lastGameIndex = 0;

var server = http.createServer(function (req, res) {
  console.log("got a request " + req.url + ", " + req.method);
  var parsedUrl = url.parse(req.url);
  var splitUrl = parsedUrl.pathname.split("/");
  if ( req.method === 'OPTIONS') {
    console.log("returning options");
    res.writeHead(200, {
      'content-type': 'text/plain' ,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    res.end();
  }
  else if ( req.method === 'GET') {
    // try to serve a file
    var filePath = '.' + req.url;
    if (filePath == './') {
      filePath = './index.html';
    }
    console.log("serving a file " + filePath);
    path.exists(filePath, function(exists) {

      if (exists) {
        fs.readFile(filePath, function(error, content) {
          if (error) {
            res.writeHead(500);
            res.end();
          }
          else {
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(content, 'utf-8');
          }
        });
      }
      else {
        res.writeHead(404);
        res.end();
      }
    });
  }
});

server.listen(1337, "127.0.0.1");

var io = socket_io.listen(server);
io.sockets.on('connection', function (socket) {
	var thisGameData;
  socket.on('joinPlayers', function (data) {
    var client = makeClient(socket);
    var gameData = joinPlayers(client, data.players);
	if (!thisGameData) {
		thisGameData = gameData;
	}
    socket.emit('confirmPlayers', gameData.playerIds);
    for (var client_i in gameData.game.clients) {
      var client = gameData.game.clients[client_i];
      client.socket.emit('updatePlayers', gameData.game.players);
    }
  });

  socket.on('updatePlayers', function(data) {
	  if (!thisGameData) return;
	  for (var i in data) {
		  var playerData = data[i];
		  var player = thisGameData.game.players[playerData.i];
		  player.x = playerData.x;
		  player.y = playerData.y;
		  player.on = playerData.on;
		  player.in = playerData.in;
	  }
	  for (var client_i in thisGameData.game.clients) {
		  var client = thisGameData.game.clients[client_i];
		  client.socket.emit('updatePlayers', thisGameData.game.players);
	  }
  });
});

function makeClient(socket) {
  return {socket:socket};
}

function initGame(gameIndex) {
  if ( games[gameIndex] === undefined ) {
    games[gameIndex] = {id:gameIndex, players:[]};
    games[gameIndex].timeCreated = new Date();
    games[gameIndex].lastUpdated = new Date();
    games[gameIndex].time = 0;
    games[gameIndex].state = "waiting";
    games[gameIndex].clients = [];
    console.log("creating a game " + JSON.stringify(games[gameIndex]));
  }
}

// get a game id and player ids for n players
function joinPlayers(client, placesWanted) {

  var currentGameIndex = lastGameIndex;

  // check games to find one that will fit us in
  while ( games[currentGameIndex] !== undefined && (games[currentGameIndex].state !== "waiting" || games[currentGameIndex].players.length >= 6-placesWanted) ) {
	  currentGameIndex++;

	  // also increment lastGameIndex if those games are full
	  if ( games[lastGameIndex].players.length >= 6  || games[lastGameIndex].state !== "waiting") {
		  lastGameIndex++;
	  }
  }
  console.log("found game " + currentGameIndex);
  if (games[currentGameIndex] === undefined) {
	  initGame(currentGameIndex);
  }
  var game = games[currentGameIndex];
  game.clients.push(client);
  var playerIds = [];
  for (var i = 0 ; i < placesWanted ; i++) {
    var newPlayerId = game.players.length;
    playerIds[playerIds.length] = newPlayerId;
    game.players[newPlayerId] = {x:0,y:0};
  }

  return  {playerIds:playerIds, game:game};
}

console.log('Server running at http://127.0.0.1:1337/');
