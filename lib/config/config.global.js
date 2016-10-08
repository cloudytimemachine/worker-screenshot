var config = module.exports = {};
var bunyan = require('bunyan');
require('pkginfo')(module);
var os = require('os');

config.httpPort = process.env.PORT || 3000;

config.redis = {
  host: process.env.REDIS_SERVICE_HOST || '127.0.0.1',
  port: process.env.REDIS_SERVICE_PORT || 6379
};

config.bucketName = process.env.BUCKET_NAME || 'waybackmachine_default';
config.projectId = process.env.GCLOUD_PROJECT;
config.keyFilePath = process.env.GCLOUD_KEYFILE;
config.gopts = {};
if (config.projectId) {
  config.gopts.projectId = config.projectId;
  config.gopts.keyFilename = config.keyFilePath;
}

config.bull = {
  requestQueue: 'screenshot-request',
  responseQueue: 'screenshot-response'
};

config.modules = [
  'gfs',
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
