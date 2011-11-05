var games = [];
var lastGameIndex = 0;
var http = require('http');
http.createServer(function (req, res) {
  if ( req.method === 'GET') {
    if ( req.url === '/game' ) {
      if ( games[lastGameIndex] === undefined ) {
        games[lastGameIndex] = {id:lastGameIndex, players:[]};
      } else if ( games[lastGameIndex].players.length > 6 ) {
        lastGameIndex++;
        games[lastGameIndex] = {id:lastGameIndex, players:[]};
      }
      var game = games[lastGameIndex];
      var player_id = game.players.length;
      game.players[player_id] = {};
      res.writeHead(200, {'content-type': 'text/plain' });
      res.end(JSON.stringify({game_id:lastGameIndex, player_id:player_id}));
      
    }
    else {
      res.writeHead(404, {'content-type': 'text/plain' });
      res.end();
    }
  }
  else if ( req.method === 'POST' ) {
    var data = '';
    req.on('data', function(chunk) { data += chunk; });
    req.on('end', function() {
      console.log(JSON.parse(data));
      res.writeHead(200, {'content-type': 'text/plain' });
      res.end("Thanks");
    });
  }
}).listen(1337, "127.0.0.1");
console.log('Server running at http://127.0.0.1:1337/');
