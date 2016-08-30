var gcloud = require('gcloud');
var url = require('url');
var async = require('async');
var projectId = process.env.GCLOUD_PROJECT;
var keyFilePath = process.env.GCLOUD_KEYFILE;
var gopts = {};
if (projectId) {
  gopts.projectId = projectId;
  gopts.keyFilename = keyFilePath;
}

console.log(gopts);

var bucketName = process.env.BUCKET_NAME || 'waybackmachine_default';

var gcs = gcloud.storage(gopts);
var bucket = gcs.bucket(bucketName);

async.waterfall([
  function createBucket(callback) {
    return gcs.createBucket(bucketName, function onBucket (err, b) {
      if (err) {
        console.log(err.message);
      }
      if (err &&
        err.message !== 'You already own this bucket. Please select another name.') {
        return callback(err);
      }
      return callback(null, b || bucket);
    });
  },
  function setPerms(b, callback) {
    console.log('gcloud bucket created');
    bucket = b;
    bucket.acl.default.add({
      entity: 'allUsers',
      role: gcloud.storage.acl.READER_ROLE
    }, callback);
  }
], function (err) {
  if (err) {
    console.log('Error creating gcloud bucket', err);
    process.exit();
  }
  console.log('bucket set to READER_ROLE for allUsers');
});

var api = module.exports = {};

api.uploadStream = function uploadStream(filename) {
  console.log('uploadStream', filename);
  var file = bucket.file(filename);
  return file.createWriteStream({
    metadata: {
      contentType: 'image/png'
    }
  });
}

api.uploadUrl = function uploadUrl(filename) {
  return ['https://storage.googleapis.com', bucketName, filename].join('/');
}
