var config = require('../config');

var api = module.exports = function (app) {
  app.get('/', api.getVersion);
  app.get('/version', api.getVersion);
  app.get('/healthz', api.healthz);
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
