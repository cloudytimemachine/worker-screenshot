var Queue = require('bull');
var async = require('async');
var config = require('../../lib/config');
var util = require('util');
var EventEmitter = require('events');

var redisHost = config.redis.host;
var redisPort = config.redis.port;
var reqQueueName = config.bull.requestQueue;
var resQueueName = config.bull.responseQueue;

var api = module.exports = {};

var shotQueue;
var responseQueue;

api.start = function (callback) {
  var ready = false;

  function emptyShotQueue () {
    console.log('emptyShotQueue');
    shotQueue.empty().then(onReady).catch(callback);
  }

  function emptyResponseQueue () {
    console.log('emptyResponseQueue');
    responseQueue.empty().then(closeResponseQueue).catch(callback);
  }

  function closeResponseQueue () {
    console.log('closeResponseQueue');
    responseQueue.close().then(onReady).catch(callback);
  }

  function onReady () {
    console.log('onReady');
    if (ready) {
      console.log('ready');
      return callback();
    }
    ready = true;
  }

  shotQueue = Queue(reqQueueName, redisPort, redisHost);
  shotQueue.once('ready', emptyShotQueue);
  responseQueue = Queue(resQueueName, redisPort, redisHost);
  responseQueue.once('ready', emptyResponseQueue);
};

api.enqueue = function (request) {
  shotQueue.add(request);
};

api.waitForResponse = function (callback) {
  responseQueue = Queue(resQueueName, redisPort, redisHost);
  responseQueue.on('ready', function () {
    responseQueue.process(function onJob (job, done) {
      done(null, true);
      responseQueue
        .close()
        .then(function () {
          callback(null, job.data);
        })
        .catch(callback);
    });
  });
};

api.ResponseEmitter = function ResponseEmitter () {
  EventEmitter.call(this);
  var self = this;
  self.responseQueue = Queue(resQueueName, redisPort, redisHost);
  self.responseQueue.on('ready', function () {
    self.emit('ready');
    console.log('responseQueue for mock is ready');
    self.responseQueue.process(function onJob (job, done) {
      setTimeout(function () {
        console.log('mock ResponseEmitter emitting response');
        self.emit('response', job.data);
        done(null, true);
      }, 1);
    });
  });
  self.responseQueue.on('error', function (err) {
    setTimeout(function () {
      self.emit('error', err);
    }, 1);
  });
};
util.inherits(api.ResponseEmitter, EventEmitter);

api.ResponseEmitter.prototype.close = function () {
  var self = this;
  self.responseQueue
    .close()
    .then(function () {
      setTimeout(function () {
        self.emit('close');
      }, 1);
    })
    .error(function () {
      setTimeout(function () {
        self.emit('error');
      }, 1);
    });
};

api.stop = function (callback) {
  async.parallel([
    function (cb) {
      if (shotQueue) {
        return shotQueue.close().then(cb);
      }
      return cb();
    },
    function (cb) {
      if (responseQueue) {
        return responseQueue.close().then(cb);
      }
      return cb();
    }
  ], function () {
    shotQueue = null;
    responseQueue = null;
    return callback();
  });
};
