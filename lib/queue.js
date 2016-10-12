var Queue = require('bull');
var worker = require('./worker');
var config = require('./config');
var async = require('async');
var redisHost = config.redis.host;
var redisPort = config.redis.port;
var api = module.exports = {};

api.name = 'queue';
var shotQueue, responseQueue;
var log;

api.init = function (app, callback) {
  log = app.log.child({module: api.name});
  var ready = false;
  function onReady () {
    if (ready) {
      return callback();
    }
    ready = true;
  }

  shotQueue = Queue(config.bull.requestQueue, redisPort, redisHost);
  shotQueue.once('ready', onReady);
  shotQueue.on('error', function onShotQueueErr (err) {
    log.error({
      err: err
    }, 'Error in shotQueue');
  });
  shotQueue.process(4, api._onShotQueueMsg);

  responseQueue = Queue(config.bull.responseQueue, redisPort, redisHost);
  responseQueue.once('ready', onReady);
  responseQueue.on('error', function onResponseQueueErr (err) {
    log.error({
      err: err
    }, 'Error in responseQueue');
  });
};

api._onShotQueueMsg = function (job, done) {
  log.info({
    jobId: job.jobId,
    data: job.data,
    id: job.data.id,
    requestedUrl: job.data.requestedUrl
  }, 'Request to process screenshot');
  worker.process(job.data, function (err, results) {
    if (err) {
      log.error({
        err: err,
        jobId: job.jobId,
        data: job.data,
        id: job.data.id,
        requestedUrl: job.data.requestedUrl
      }, 'error processing screenshot, failing job');
      var response = job.data;
      response.status = 'FAILED';
      response.error = err.message;
      responseQueue.add(response);
      return done(err);
    }
    log.info({
      jobId: job.jobId,
      data: job.data,
      id: job.data.id,
      requestedUrl: job.data.requestedUrl
    }, 'succesfully processed screenshot');
    responseQueue.add(results);
    done(null, results);
  });
};

api.close = function close (callback) {
  async.parallel([
    function (cb) {
      if (shotQueue) {
        log.info('closing shotQueue');
        return shotQueue.close().then(cb);
      }
      return cb();
    },
    function (cb) {
      if (responseQueue) {
        log.info('closing responseQueue');
        return responseQueue.close().then(cb);
      }
      return cb();
    }
  ], function () {
    log.info('queues have been closed');
    shotQueue = null;
    responseQueue = null;
    return callback();
  });
};
