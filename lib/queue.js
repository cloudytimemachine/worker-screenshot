var Queue = require('bull');
var worker = require('./worker');
var config = require('./config');

var redisHost = config.redis.host;
var redisPort = config.redis.port;

var shotQueue = Queue(config.bull.requestQueue, redisPort, redisHost);
var responseQueue = Queue(config.bull.responseQueue, redisPort, redisHost);

shotQueue.process(2, function (job, done) {
  console.log('queue request to process ', job.data);
  worker(job.data, function (err, results) {
    if (err) {
      console.log('error processing', err);
      var response = job.data;
      response.status = 'FAILED';
      response.error = err.message;
      responseQueue.add(response);
      return done(err);
    }
    console.log('succesfully processed ', job.data);
    responseQueue.add(results);
    done(null, results);
  });
});
