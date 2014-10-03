/*

SUPER CLASS FOR ALL MESSAGE WORKERS

Message Manager will call the appropriate message worker functions.
The manager is the all-knowning dictator of all messages!!
Message workers should assume they have been called correctly.

Message workers should:

1. Eat a message (string):
	- Should not be tokenized array so different patterns 
	  can be applied (REGEX, NLP, etc.)
2. Swallow a message:
	- Store the relevant attributes for digestion, if asked to do so
3. Digest a message (if requested):
	- The worker should not digest a message without its
	  all-knowing all-seeing manager telling it to do so.

Additional details in the functions below.
*/
events = require('events');

var MessageWorker = function(messageWorker){
	this.messageWorker = messageWorker;
	this.events = new events.EventEmitter();
}

/* "Eat" should parse the message and "swallow" the attributes 
   e.g., a "weather" worker, should identify "zip", "city", etc., 
         and store what's available in the member attributes.
  The worker should assume it was called correctly.  Errors should be
  rasied if it thinks it's eating the wrong message (e.g., not a weather message);
  only raise a message if it cannot find attributes to swallow */
function eat(message, callback){
	err = "ERROR: MessageWorker should not be called directly.";
	callback(err);
}


/* "Digest" should take the swallowed attributes, and process
   the correction action.  E.g., read a JSON stream from a remote
   host, post data, etc.; and create the response to the user
*/
function digest(language, callback){
	err = "ERROR: MessageWorker should not be called directly.";
	callback(err);
}

MessageWorker.prototype.eat = eat;
MessageWorker.prototype.digest = digest;

module.exports = MessageWorker;