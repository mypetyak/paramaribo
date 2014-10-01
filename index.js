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
  this.findings = [];
  this.pattern = null;
}
PatternWorker.prototype = Object.create(events.EventEmitter.prototype);
PatternWorker.prototype.constructor = PatternWorker;

PatternWorker.prototype.eat = function(message){
  matches = message.match(this.pattern);
  return this.digest(matches);
}

PatternWorker.prototype.parse_findings = function(){
  return null;
}

PatternWorker.prototype.digest = function(matches){
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
    this.zip = matches[1];
    var uri = 'http://api.openweathermap.org/data/2.5/weather?q=' + this.zip;

    // define the pattern we should seek in any streams passed to jstream
    var jstream = JSONStream.parse(['weather', true, 'main']);

    jstream.pw = this;
    // 'data' event is triggered each time jstream's pattern is found during JSON parsing     
    jstream.on('data', function(data){
      // collect findings and associate with the PatternWorker object for later use
      this.pw.findings.push(data);
    });

    // 'root' event is triggered when jstream reaches end of JSON
    jstream.on('root', function(root, count){
      // helpful in determining when all our PatternWorkers have completed
      this.pw.emit('done eating', this.pw);
    });
    
    var request = http.get(uri).on('response', function(response) {
      console.log('response received');
      // pipe the http response stream into JSONStream interpreter
      response.pipe(jstream);
    });
  }
}

WeatherPW.prototype.parse_findings = function(){
  if (this.findings.length < 1){
    return false;
  }
  else{
    var english = 'The weather in '+ this.zip +' is currently: ';
    for (i = 0; i < this.findings.length; i++){
      i > 1 ? english += ', ' : null;
      english += this.findings[i];
    }  
    return english;
  }
  
}

/* SERVER EVENT HANDLING */
io.on('connection', function(socket){
  socket.on('user command', function(msg){
    var findings = {};
    var pw_list = [WeatherPW];
    for (i = 0; i < pw_list.length; i++){
      var pw = new pw_list[i];
      pw.on('done eating', function(result){
        var english = pw.parse_findings();
        if (english){
          io.emit('server reply', english);
        }
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
