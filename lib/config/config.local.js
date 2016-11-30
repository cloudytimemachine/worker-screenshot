var config = module.exports = {};
var fs = require('fs');
var bunyan = require('bunyan');
require('pkginfo')(module);
var os = require('os');
var path = require('path');

config.local = true;

config.httpPort = process.env.PORT || 3000;

config.redis = {
  host: process.env.REDIS_SERVICE_HOST || '127.0.0.1',
  port: process.env.REDIS_SERVICE_PORT || 6379
};


var filePath = process.env.SCREENSHOT_FILEPATH || 'snapshot';

config.filepath = path.join(__dirname, '..', '..', filePath);

try {
    var stat = fs.statSync(config.filepath);
} catch (e) {
    fs.mkdirSync(config.filepath);
}



config.bull = {
  requestQueue: 'screenshot-request',
  responseQueue: 'screenshot-response'
};

config.modules = [
  'queue',
  'worker'
];

config.info = {
  version: module.exports.version,
  name: module.exports.name,
  instance: os.hostname()
};

config.bunyan = {
  name: config.info.name,
  streams: [
    {
      level: process.env.LOG_LEVEL || 'info',
      stream: process.stdout
    }
  ],
  serializers: bunyan.stdSerializers,
  src: true
};
