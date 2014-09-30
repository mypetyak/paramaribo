var http = require('http');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.set('port', (process.env.PORT || 5000))


/* PATTERN MATCHING */
// PatternWorker is the base interface for all pattern/response objects
function PatternWorker(){
  this.pattern = null;
}

PatternWorker.prototype.eat = function(message){
  matches = message.match(this.pattern);
  return this.digest(matches);
}

PatternWorker.prototype.digest = function(matches){
  return false;
}

// Specific example of a PatternWorker subclass
function WeatherPW(){
  PatternWorker.call(this);
  this.pattern = /(?:weather\s+)(\d{5})/; 
}
WeatherPW.prototype = Object.create(PatternWorker.prototype);
WeatherPW.prototype.constructor = WeatherPW;

// Redefine the 'digest' method for specific weather-related purpose
WeatherPW.prototype.digest = function(matches){
  if (matches && matches.length > 1){
    var zip = matches[1];
    var uri = 'http://api.openweathermap.org/data/2.5/weather?q=' + zip;
    response = 'Once I figure out how to create Transform streams in Node.js, I\'ll parse the results of the following URI for you: ' + uri;
  }
  else {
    response = false;
  }
  return response;
}

/* SERVER EVENT HANDLING */
io.on('connection', function(socket){
  socket.on('user command', function(msg){
    var pw_list = [WeatherPW];
    for (i = 0; i < pw_list.length; i++){
      var pw = new pw_list[i];
      var response = pw.eat(msg);
      if (response){
        io.emit('server reply', response);
        return;  
      }  
    }
    // fall-thru
    io.emit('server reply', 'no pattern found :(');
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
