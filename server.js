var http = require('http');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

io.on('connection', function(socket){
  socket.on('user command', function(msg){
    var re = /(?:weather\s+)(\d{5})/;
    zip = msg.match(re);

    if (zip && zip.length > 1){
      var uri = 'http://api.openweathermap.org/data/2.5/weather?q=' + zip[1];
      io.emit('server reply', 'Once I figure out how to create Transform streams in Node.js, I\'ll parse the results of the following URI for you: ' + uri);
    }
    else {
      io.emit('server reply', "uh oh, I didn't understand :(");
    }
  });
});


app.get('/', function(req, res){
  res.sendfile('index.html');
});

server.listen(3000, function(){
  console.log('listening on *:3000');
});
