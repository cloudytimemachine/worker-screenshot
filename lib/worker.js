var gfs = require('./gfs');
var shot = require('./shot');
var resize = require('./resize');
var async = require('async');

module.exports = function captureAndUpload (data, callback) {
  var requestedUrl = data.requestedUrl;
  console.log('worker request for ', data);
  var screenStream = shot.getCaptureStream(requestedUrl);
  screenStream.on('error', function onErr (err) {
    console.log('screenStream error', err);
    return callback(err);
  });

  var now = new Date();
  var fileName = data.host + data.path + '_' + now.getTime() + '.png';
  var thumbFileName = data.host + data.path + '_' + now.getTime() + '_thumb.png';

  var resizeStream = resize(thumbFileName);
  screenStream.pipe(resizeStream);

  async.parallel({
    thumbnailImage: async.apply(upload, thumbFileName, resizeStream),
    originalImage: async.apply(upload, fileName, screenStream)
  }, function (err, results) {
    if (err) {
      return callback(err);
    }
    data.status = 'SUCCESSFUL';
    data.originalImage = results.originalImage;
    data.thumbnailImage = results.thumbnailImage;
    console.log('results', data);
    return callback(null, data);
  });
};

function upload (fileName, inputStream, callback) {
  console.log('attempting to upload', fileName);
  var gStream = gfs.uploadStream(fileName);
  gStream.on('finish', function () {
    return callback(null, gfs.uploadUrl(fileName));
  });
  gStream.on('error', function (err) {
    console.log('err uploading', fileName);
    return callback(err);
  });

  inputStream.pipe(gStream);
}
