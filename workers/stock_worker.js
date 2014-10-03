var MessageWorker = require('./message_worker'),
	util = require('util');

var StockWorker = function( ){
	MessageWorker.call(this);
};

util.inherits(StockWorker, MessageWorker);

function eat(message, callback){
	err = "It looks like you're trying to find information on stocks, but I can't figure out the symbol.";
	callback(err);
}

function digest(language, callback){
	err = "It looks like you're trying to stock information for" + this.symbol + "but something went horribly, horribly, wrong.";
	callback(err);
}

//Overwrite inherited methods.
StockWorker.prototype.eat = eat;
StockWorker.prototype.digest = digest;

module.exports = StockWorker;