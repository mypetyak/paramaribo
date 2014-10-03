var http = require('http');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var events = require('events');
var MessageManager = require('./workers/message_manager.js')

app.set('port', (process.env.PORT || 5000))

manager = new MessageManager();

/* SERVER EVENT HANDLING */
io.on('connection', function(socket){
  socket.on('user command', function(msg){
    manager.process(msg, function(err, data){
      if(err) io.emit('server reply', err);
      if(data) io.emit('server reply', data)
    });
  });
});

/* SERVER ROUTING */
app.get('/', function(req, res){
  res.sendfile('index.html');
});

/* SERVER EXECUTION */
server.listen(app.get('port'), function(){
  console.log('listening on:' + app.get('port'));
});
