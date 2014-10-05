var MessageWorker = require('./message_worker'),
	util = require('util'),
	http = require('http'),
	JSONStream = require('JSONStream');

var WeatherWorker = function( ){

	MessageWorker.call(this);
};

util.inherits(WeatherWorker, MessageWorker);

function eat(message, callback){
	//clear anything previously swallowed
	this.zip = ""; this.city = "";

	var loc_pattern = /(\d{5})$/i;
	matches = message.match(loc_pattern);
	if(matches && matches.length > 1){
		this.zip = matches[0];
		this.city = '';
	}

	//Test that enough was swallowed to digest
	if(this.zip || this.city){
		callback(null);
	}
	else{
		err = "It looks like you're trying to find weather, but I can't figure out your location.";
		callback(err);
	}
}

function digest(callback){
	//take swallowed attributes to create location query string.
	var location = this.zip; //...+...+;
    var uri = 'http://api.openweathermap.org/data/2.5/weather?q=' + location;

    console.log(uri);

    // we'll search for JSON root. I think this does the trick.
    var jstream_fuzzynow = JSONStream.parse(['$']);
    jstream_fuzzynow.mw = this;  //Chris to clarify if still required

    var results = {};

    // 'root' event is triggered when jstream reaches end of JSON
    jstream_fuzzynow.on('root', function(root, count){
      var http_code = root.cod;
      if (http_code == '200'){
        results.city = root.name;
        results.fuzzy = root.weather[0].description;
        results.country = root.sys.country;
        results.successful = true;
	  }

	  if(results){
	  	var response = parseResponse(results);
    	callback(null, response);
        } else {
			err = "It looks like you're trying to find weather for " + location + " but something went horribly, horribly, wrong.";
			callback(err);
		}

    });

    var request = http.get(uri).on('response', function(response) {
      console.log('response received');
      // pipe the http response stream into JSONStream interpreter
      response.pipe(jstream_fuzzynow);
    });
}

//This function should be overwritten for any non-english workers
function parseResponse(results){
	var response = 'The weather in '+ results.city +' is currently: ' + results.fuzzy;
	return response;
}

//Overwrite inherited methods.
WeatherWorker.prototype.eat = eat;
WeatherWorker.prototype.digest = digest;
WeatherWorker.prototype.parseResponse = parseResponse;

module.exports = WeatherWorker;
