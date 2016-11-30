var env = process.env.NODE_ENV;
var configFile = '';

switch (env) {
  case 'TESTING': configFile = './config.test';
    break;
  case 'PRODUCTION': configFile = './config.global';
    break;
  default: configFile = './config.local';
    break;
}

var config = require(configFile);
module.exports = config;
