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
  this.findings = new Object();
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
  this.pattern = /(?:weather\s+)(?:in\s+)?(\d{5}|[\w ]+,?\s*[\w ]*)$/i; 
}
WeatherPW.prototype = Object.create(PatternWorker.prototype);
WeatherPW.prototype.constructor = WeatherPW;

// Redefine the 'digest' method for specific weather-related purpose
WeatherPW.prototype.digest = function(matches){
  if (matches && matches.length > 1){
    var loc_raw = matches[1];

    // remove whitespace
    var loc_clean = loc_raw.replace(/\s/g, '');
    var uri = 'http://api.openweathermap.org/data/2.5/weather?q=' + loc_clean;

    // we'll search for JSON root. I think this does the trick.
    var jstream_fuzzynow = JSONStream.parse(['$']);
    jstream_fuzzynow.pw = this;

    // 'root' event is triggered when jstream reaches end of JSON
    jstream_fuzzynow.on('root', function(root, count){
      var http_code = root.cod;
      if (http_code == '200'){
        this.pw.findings.city = root.name;
        this.pw.findings.fuzzy = root.weather[0].description;
        this.pw.findings.country = root.sys.country;
        this.pw.findings.successful = true;
      }
      // helpful in determining when all our PatternWorkers have completed
      this.pw.emit('done eating', this.pw);
    });
    
    var request = http.get(uri).on('response', function(response) {
      console.log('response received');
      // pipe the http response stream into JSONStream interpreter
      response.pipe(jstream_fuzzynow);
    });
  }
}

WeatherPW.prototype.parse_findings = function(){
  if (!this.findings.successful){
    return false;
  }
  else{
    var english = 'The weather in '+ this.findings.city +' is currently: ' + this.findings.fuzzy;
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
