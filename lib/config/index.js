var config = module.exports = {};

config.redis = {
  host: process.env.REDIS_SERVICE_HOST || '127.0.0.1',
  port: process.env.REDIS_SERVICE_PORT || 6379
};

config.bull = {
  requestQueue: 'screenshot-request',
  responseQueue: 'screenshot-response'
};
