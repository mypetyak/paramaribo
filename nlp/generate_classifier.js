var natural = require('natural');

//Train the classifier
classifier = new natural.BayesClassifier()
classifier.addDocument('what is the weather in qqqq', 'weather');
classifier.addDocument('how hot is it in qqqq', 'weather');
classifier.addDocument('what is the temperature in qqqq', 'weather');
classifier.addDocument('how cold is it in qqqq', 'weather');
classifier.addDocument('is it raining today', 'weather');
classifier.addDocument('what is the current price of qqqq', 'stocks');
classifier.addDocument('what is the value of qqqq', 'stocks');

classifier.save('classifer.json', function(err, callback){
  //just save it!
})
