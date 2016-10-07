var gcloud = require('gcloud');
var config = require('./config');
var async = require('async');
var log;

var api = module.exports = {};

api.name = 'gfs';

api.init = function (app, callback) {
  log = app.log.child({
    module: api.name,
    bucketName: config.bucketName
  });
  api._gcs = gcloud.storage(config.gopts);
  api._bucket = api._gcs.bucket(config.bucketName);

  async.waterfall([
    function createBucket (callback) {
      return api._gcs.createBucket(config.bucketName, function onBucket (err, b) {
        var existMsg = 'You already own this bucket. Please select another name.';
        if (err && err.message !== existMsg) {
          log.error({
            err: err
          }, 'Error attempting to create the bucket');
          return callback(err);
        }
        if (err) {
          log.info('Bucket already exists');
        } else {
          log.info('Bucket has been created');
        }
        return callback(null, b || api._bucket);
      });
    },
    function setPerms (b, callback) {
      api._bucket = b;
      var acl = {
        entity: 'allUsers',
        role: gcloud.storage.acl.READER_ROLE
      };
      log.info({
        acl: acl
      }, 'Configuring bucket ACL rules');
      api._bucket.acl.default.add(acl, callback);
    }
  ], function (err) {
    if (err) {
      log.error({
        err: err
      }, 'Unable to configure gcloud bucket');
      return callback(err);
    }
    log.info('Bucket has been created and ACL permissions set');
    return callback();
  });
};

api.close = function close (callback) {
  return callback();
};

api.uploadStream = function uploadStream (filename) {
  log.info({
    filename: filename
  }, 'Creating uploadStream');
  var file = api._bucket.file(filename);
  return file.createWriteStream({
    metadata: {
      contentType: 'image/png'
    }
  });
};

api.uploadUrl = function uploadUrl (filename) {
  return ['https://storage.googleapis.com', config.bucketName, filename].join('/');
};
