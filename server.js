var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');

var games = [];
var lastGameIndex = 0;

http.createServer(function (req, res) {
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
  // all the action happens from post requests
  else if ( req.method === 'POST' ) {
    var data = '';
    req.on('data', function(chunk) { data += chunk; });
    req.on('end', function() {
      if (splitUrl[1] === 'game') {
        console.log("got game: " + data);
        var postData;
        var gameId = splitUrl[2];
        try {
          postData = JSON.parse(data);
        } catch (e) {
          console.log("error parsing move");
        }
        // getting a game id
        if (gameId === undefined) {
          if (postData === undefined || postData.players === undefined) {
            res.writeHead(404, {'content-type': 'text/plain' });
            res.end("There was an error, if you want to start a game you must suplpy the number of players.");
            return;
          } else {
            // get a game id and player ids for n players
            var placesWanted = postData.players;
            
            var currentGameIndex = lastGameIndex;
            // if the current game is empty / uninitialised
            if ( games[currentGameIndex] === undefined ) {
              games[currentGameIndex] = {id:lastGameIndex, players:[]};
              games[currentGameIndex].timeCreated = new Date();
              games[currentGameIndex].lastUpdated = new Date();
              games[currentGameIndex].time = 0;
              games[currentGameIndex].state = "waiting";
              console.log("creating a game " + JSON.stringify(games[currentGameIndex]));
            }
            // if the current game is too full
            else {
              while ( games[currentGameIndex].state !== "waiting" || games[currentGameIndex].players.length >= 6-placesWanted ) {
                currentGameIndex++;
                games[currentGameIndex] = {id:currentGameIndex, players:[]};

                // also increment lastGameIndex if those games are full
                if ( games[lastGameIndex].players.length >= 6  || games[lastGameIndex].state !== "waiting") {
                  lastGameIndex++;
                }
              }
            }
            var game = games[currentGameIndex];
            var playerIds = [];
            for (var i = 0 ; i < postData.players ; i++) {
              var newPlayerId = game.players.length;
              playerIds[playerIds.length] = newPlayerId;
              game.players[newPlayerId] = {};
            }
            console.log("returning new player ids " + playerIds + ", for game " + lastGameIndex);
            res.writeHead(200, {'content-type': 'text/plain'});
            res.end(JSON.stringify({game_id:currentGameIndex, players:playerIds}));
            return;
          }
        }
        else {
          var game = games[gameId];
          if (game === undefined) {
            res.writeHead(404, {'content-type': 'text/plain' });
            res.end("There was an error. The game id you specified does not exist/");
            return;
          }
          var now = new Date();
          console.log("game time is " + game.time);
          game.time = game.time + (now - game.lastUpdated);
          console.log("lastup " + game.lastUpdated);
          console.log("diff " + (now-game.lastUpdated));
          console.log("game time is " + game.time);
          game.lastUpdated = now;
          // update state
          if (game.state === "waiting" && (game.time > 10000 || game.players.length >= 6)) {
            game.state = "countdown";
            game.time = 10000;
          }
          else if (game.state === "countdown" && game.time > 13000) {
            game.state = "playing";
          }
          // checking state
          if (postData === undefined) {
            console.log("returning game state " + JSON.stringify(game));
            if ( game.state === "countdown" || game.state === "waiting" ) {
              res.writeHead(200, {'content-type': 'text/plain'});
              res.end(JSON.stringify({state: game.state, players:game.players.length, time:game.time}));
              return;
            } else if ( game.state === "finished" ) {
              res.writeHead(200, {'content-type': 'text/plain'});
              res.end(JSON.stringify({state: game.state, winner: game.winner}));
              return;
            }
          }
          // a move
          else {
            // if there is no move
            if (!postData.players) {
              res.writeHead(404, {'content-type': 'text/plain' });
              res.end("There was an error. You did not specify any player moves, but the game is in play.");
              return;
            }
            // if the game is not in progress
            else if (game.state !== "playing") {
              res.writeHead(404, {'content-type': 'text/plain' });
              res.end("There was an error. You cannot send a move, the game has not started.");
              return;
            }
            // deal with the move
            else {
              var playersMoved = postData.players;
              var otherPlayers = game.players.slice(0);
              // update player positions on the server
              for (var playerIndex in playersMoved) {
                game.players[playerIndex] = playersMoved[playerIndex];
                otherPlayers[playerIndex] = null;
              }
              // get the players which did not have moves sent and return them
              var playersToReturn = [];
              for (var i = 0 ; i < otherPlayers.length ; i++) {
                if (otherPlayers[i] !== null) {
                  playersToReturn[playersToReturn.length] = otherPlayers[i];
                }
              }
              res.writeHead(200, {'content-type': 'text/plain'});
              res.end(JSON.stringify({state: game.state, players: playersToReturn}));
              return;
            }
          }
        }
      }
      // fallthrough
      console.log("no good response");
      res.writeHead(404, {'content-type': 'text/plain' });
      res.end("There was an error.");
    });
  }
}).listen(1337, "127.0.0.1");
console.log('Server running at http://127.0.0.1:1337/');
