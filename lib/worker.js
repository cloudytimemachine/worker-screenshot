var gfs = require('./gfs');
var url = require('url');
var shot = require('./shot');
var resize = require('./resize');
var async = require('async');

module.exports = function captureAndUpload (requestedUrl, callback) {
  requestedUrl = requestedUrl.toLowerCase();
  if (requestedUrl.indexOf('http://') !== 0 && requestedUrl.indexOf('https://') !== 0) {
    requestedUrl = 'http://'+requestedUrl;
  }
  console.log('worker request for ', requestedUrl);
  var screenStream = shot.getCaptureStream(requestedUrl);
  screenStream.on('error', function onErr (err) {
    console.log('screenStream error', err);
    return callback(err);
  });

  var now = new Date();
  var parsed = url.parse(requestedUrl);
  var fileName = parsed.hostname + parsed.path + '_' + now.getTime() + '.png';
  var thumbFileName = parsed.hostname + parsed.path + '_' + now.getTime() + '_thumb.png';

  var resizeStream = resize(thumbFileName);
  screenStream.pipe(resizeStream);

  async.parallel({
    thumb: async.apply(upload, thumbFileName, resizeStream),
    originalImage: async.apply(upload, fileName, screenStream)
  }, function (err, results) {
    if (err) {
      return callback(err);
    }
    results.createdAt = now;
    results.domain = parsed.hostname;
    results.href = parsed.href;
    results.path = parsed.path;
    results.requestedUrl = requestedUrl;
    console.log('results', results);
    return callback(null, results);
  });
}

function upload(fileName, inputStream, callback) {
  console.log('attempting to upload', fileName);
  var gStream = gfs.uploadStream(fileName);
  gStream.on('finish', function() {
    return callback(null, gfs.uploadUrl(fileName));
  });
  gStream.on('error', function(err) {
    console.log('err uploading', fileName);
    return callback(err);
  });

  inputStream.pipe(gStream);
}
