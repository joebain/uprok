var http = require('http');
var url = require('url');
var path = require('path');
var fs = require('fs');

var games = [];
var lastGameIndex = 0;

http.createServer(function (req, res) {
  console.log("got a request " + req.url + ", " + req.method);
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
    var parsedUrl = url.parse(req.url);
    var splitUrl = parsedUrl.pathname.split("/");
    if ( splitUrl[1] === 'game' ) {
      if ( splitUrl[2] != undefined ) {
        var gameId = splitUrl[2];
        var game = games[gameId];
        if ( game != undefined && game.players.length < 6) {
          var player_id = game.players.length;
          game.players[player_id] = {};
          console.log("returning a player id " + player_id + " in existing game " + gameId);
          res.writeHead(200, {'content-type': 'text/plain' , 'Access-Control-Allow-Origin' : '*'});
          res.end(JSON.stringify({game_id:lastGameIndex, player_id:player_id}));
        } else {
          console.log("cuoldnt get player id for game " + gameId);
          res.writeHead(404, {'content-type': 'text/plain' });
          res.end("There is no game with that id or it is full.");
        }
      } else {
        if ( games[lastGameIndex] === undefined ) {
          games[lastGameIndex] = {id:lastGameIndex, players:[]};
        } else if ( games[lastGameIndex].players.length >= 6 ) {
          lastGameIndex++;
          games[lastGameIndex] = {id:lastGameIndex, players:[]};
        }
        var game = games[lastGameIndex];
        var player_id = game.players.length;
        game.players[player_id] = {};
        console.log("returning a new player id " + player_id + ", for game " + lastGameIndex);
        res.writeHead(200, {'content-type': 'text/plain' , 'Access-Control-Allow-Origin' : '*'});
        res.end(JSON.stringify({game_id:lastGameIndex, player_id:player_id}));
      }
      
    } else if ( splitUrl[1] === 'players') {
      var gameId = splitUrl[2];
      var game = games[gameId];
      if ( game != undefined ) {
        console.log("returning players in existing game " + gameId);
        res.writeHead(200, {'content-type': 'text/plain' , 'Access-Control-Allow-Origin' : '*'});
        res.end(JSON.stringify(game.players));
      }
    } else {
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

//      res.writeHead(404, {'content-type': 'text/plain' });
//      res.end("There was a problem.");
    }
  }
  else if ( req.method === 'POST' ) {
    var data = '';
    req.on('data', function(chunk) { data += chunk; });
    req.on('end', function() {
      if (req.url === '/move') {
        console.log("got move: " + data);
        var move;
        try {
          move = JSON.parse(data);
        } catch (e) {
          console.log("error parsing move");
        }
        if (move != undefined && move.game_id != undefined && move.players != undefined) {
          console.log("old players: ");
          console.log(JSON.stringify(games[move.game_id].players));
          for (var p in move.players) {
            var playerIndex = parseInt(p);
            console.log("player index: " + playerIndex);
            games[move.game_id].players[playerIndex].position = move.players[p].position;
          }
          res.writeHead(200, {'content-type': 'text/plain' , 'Access-Control-Allow-Origin' : '*'});
          res.end(JSON.stringify(games[move.game_id]));
        } else {
          res.writeHead(404, {'content-type': 'text/plain' });
          res.end("There was an erro, the game does not exist or you didnt supply a move or players");
        }
      }
    });
  }
}).listen(1337, "127.0.0.1");
console.log('Server running at http://127.0.0.1:1337/');
