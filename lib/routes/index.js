var restify = require('restify');
var config = require('../config');
var path = require('path');

var api = module.exports = function (app) {
  app.get('/', api.getVersion);
  app.get('/version', api.getVersion);
  app.get('/healthz', api.healthz);
  app.get(/\/snapshot\/?.*/, api.snapshot);
};

api.getVersion = function getVersion (req, res, next) {
  res.end(config.info.version);
  return next();
};

api.healthz = function healthz (req, res, next) {
  // TODO: Implement health check that makes sure we're connected to bull
  var response = config.info;

  var message = 'OK';

  response.message = message;
  res.json(response);
  return next();
};

api.snapshot = restify.serveStatic({
  directory: path.join(__dirname, '..')
});
