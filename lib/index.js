var bunyan = require('bunyan');
var restify = require('restify');
var async = require('async');
var path = require('path');
var config = require('./config');
var routes = require('./routes');

var log = bunyan.createLogger(config.bunyan);

require('http-shutdown').extend();

var api = module.exports = {};

api.start = function start (callback) {
  log.info('Starting application');
  var app = api.app = restify.createServer({
    log: log.child({module: 'restify'})
  });
  app.use(restify.acceptParser(app.acceptable));
  app.use(restify.queryParser());
  app.use(restify.gzipResponse());

  routes(app);

  async.forEachSeries(config.modules, function eachMod (mod, cb) {
    mod = path.join(__dirname, '/', mod);
    log.info({
      mod: mod
    }, 'loading module');
    mod = require(mod);
    mod.init(app, function moduleLoaded (err) {
      if (!err) {
        log.info({
          moduleName: mod.name
        }, 'loaded module');
      }
      cb(err);
    });
  }, function (err) {
    if (err) {
      return callback(err);
    }
    api.server = app.listen(config.httpPort, function () {
      var host = api.server.address().address;
      var port = api.port = api.server.address().port;
      log.info({
        host: host,
        port: port
      }, 'App is now listening for incoming http requests');
      return callback();
    }).withShutdown();
  });
};

api.stop = function stop (callback) {
  log.info('Stopping application server');

  if (api.server) {
    api.server.shutdown(function onShutdown () {
      log.info('HTTP server stopped');
      api.server = null;
      api.app = null;

      async.forEachSeries(config.modules, function eachMod (mod, cb) {
        mod = path.join(__dirname, '/', mod);
        log.info({
          mod: mod
        }, 'unloading module');
        mod = require(mod);
        mod.close(function moduleUnloaded () {
          log.info({
            moduleName: mod.name
          }, 'closed module');
          cb();
        });
      }, callback);
    });
  }
};
