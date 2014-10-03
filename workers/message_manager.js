/*
  The Message Manager has complete control over the message workers
  He brings the workers into the world, tells them when to eat,
  tells them what to digest, and takes credit for their work.

  Message workers are not meant to be direct exposed.  Message requests
  and response should occur through the message manager
*/

var WeatherWorker = require('./weather_worker'),
    StockWorker = require('./stock_worker')
    natural = require('natural');

var MessageManager = function(language){
    //store language
    this.language = language || "EN";

    //Create the language classifier; loaded with default info
    this.classifier = natural.BayesClassifier;
    natural.BayesClassifier.load('./nlp/classifier.json', null, function(err, restored){
        classifier = restored;//just load it
      });

    //Create workers.  
    // Workers classes must be stored in attributes with the
    // same name as the classifications for dicitionary lookup to work
    //NOTE: These defualts are "english speaking" workers.  
    //  To create translations, subclass MessagetypeWorker to MessagetypeWorkerXX, where
    //  XX is the ISO language code (e.g., Spanish: WeatherWorkerES)
    this.workers = {};
    this.workers.weather = new WeatherWorker();
    this.workers.stocks = new StockWorker();
}

function process(message, callback){
  var classification = classifier.classify(message);
  if(!(classification in this.workers)){
    err = "Sorry... We have a lot of busy mingons, but nobody to work that type of request."
    callback(err);
    return;
  }

  var worker = this.workers[classification];
  worker.eat(message, function(err){
    if(err){
      callback(err);
      return;
    }

    worker.digest(function(err, data){
      callback(err, data);
    });
  });
}

MessageManager.prototype.process = process;

module.exports = MessageManager;