var config = require('./config.global');

config.bunyan.streams = [
  {
    level: process.env.LOG_LEVEL || 'info',
    path: 'test.log'
  }
];
config.bunyan.src = true;

config.bull = {
  requestQueue: 'TESTING-screenshot-request',
  responseQueue: 'TESTING-screenshot-response'
};

module.exports = config;
