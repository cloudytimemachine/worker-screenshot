var gfs = require('./gfs');
var shot = require('./shot');
var resize = require('./resize');
var async = require('async');

var api = module.exports = {};
api.name = 'worker';

var log;

api.init = function init (app, callback) {
  log = app.log.child({module: api.name});
  return callback();
};

api.close = function close (callback) {
  return callback();
};

api.process = function process (data, callback) {
  var requestedUrl = data.requestedUrl;
  var reqLog = log.child({requestedUrl: requestedUrl});
  reqLog.info({
    data: data
  }, 'Incoming request to process url');

  var screenStream = shot.getCaptureStream(requestedUrl);
  screenStream.on('error', function onErr (err) {
    reqLog.error({
      err: err
    }, 'screenStream error');
    return callback(err);
  });

  var now = new Date();
  var fileName = data.host + data.path + '_' + now.getTime() + '.png';
  var thumbFileName = data.host + data.path + '_' + now.getTime() + '_thumb.png';

  var resizeStream = resize(thumbFileName);
  resizeStream.on('error', function onErr (err) {
    reqLog.error({
      err: err,
      thumbFileName: thumbFileName
    }, 'Error resizing image');
    return callback(err);
  });
  screenStream.pipe(resizeStream);

  async.parallel({
    thumbnailImage: async.apply(upload, thumbFileName, resizeStream, reqLog),
    originalImage: async.apply(upload, fileName, screenStream, reqLog)
  }, function (err, results) {
    if (err) {
      reqLog.error({
        err: err,
        thumbFileName: thumbFileName,
        fileName: fileName,
        results: results
      }, 'Error uploading images to gfs');
      return callback(err);
    }
    data.status = 'SUCCESSFUL';
    data.originalImage = results.originalImage;
    data.thumbnailImage = results.thumbnailImage;
    reqLog.info(data, 'Successfully uploaded snapshots');
    return callback(null, data);
  });
};

function upload (fileName, inputStream, reqLog, callback) {
  reqLog.info({
    fileName: fileName
  }, 'attempting to upload file');
  var gStream = gfs.uploadStream(fileName);
  gStream.on('finish', function () {
    reqLog.info({
      fileName: fileName
    }, 'Upload of file was successful');
    return callback(null, gfs.uploadUrl(fileName));
  });
  gStream.on('error', function (err) {
    reqLog.error({
      err: err,
      fileName: fileName
    }, 'Upload of file failed');
    return callback(err);
  });

  inputStream.pipe(gStream);
}
