var http = require('http');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var JSONStream = require('JSONStream');
var events = require('events');

app.set('port', (process.env.PORT || 5000))


/* PATTERN MATCHING */
// PatternWorker is the base interface for all pattern/response objects
function PatternWorker(){
  events.EventEmitter.call(this);
  this.pattern = null;
}
PatternWorker.prototype = Object.create(events.EventEmitter.prototype);
PatternWorker.prototype.constructor = PatternWorker;

PatternWorker.prototype.eat = function(message){
  matches = message.match(this.pattern);
  return this.digest(matches);
}

PatternWorker.prototype.digest = function(matches){
  // return false;
  this.emit('done eating', null);
}

// Specific example of a PatternWorker subclass
function WeatherPW(){
  PatternWorker.call(this);
  this.pattern = /(?:weather\s+)(\d{5})/i; 
}
WeatherPW.prototype = Object.create(PatternWorker.prototype);
WeatherPW.prototype.constructor = WeatherPW;

// Redefine the 'digest' method for specific weather-related purpose
WeatherPW.prototype.digest = function(matches){
  if (matches && matches.length > 1){
    var zip = matches[1];
    var uri = 'http://api.openweathermap.org/data/2.5/weather?q=' + zip;
    var jstream = JSONStream.parse(['weather', true, 'main']);

    // though not used yet, let's include an instance of 'this' 
    // so we can keep track of where the event is coming from
    jstream.pw = this;
    jstream.on('data', function(data){
      this.pw.emit('found', data);
    });

    jstream.on('root', function(root, count){
      // though not consumed yet, this event could be helpful in ensuring
      // all our PatternWorkers have completed before parsing response to user
      this.pw.emit('done eating', this.pw);
    });
    
    var request = http.get(uri).on('response', function(response) {
      console.log('response received');
      response.pipe(jstream);
    });
  }
}

/* SERVER EVENT HANDLING */
io.on('connection', function(socket){
  socket.on('user command', function(msg){
    var pw_list = [WeatherPW];
    for (i = 0; i < pw_list.length; i++){
      var pw = new pw_list[i];
      pw.on('found', function(result){
        io.emit('server reply', result);
      });
      var response = pw.eat(msg);
    }
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
