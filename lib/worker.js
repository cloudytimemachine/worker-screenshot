var gfs = require('./gfs');
var shot = require('./shot');
var resize = require('./resize');
var async = require('async');
var fs = require('fs');
var pump = require('pump');
var pumpify = require('pumpify');

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
  var reqLog = log.child({requestedUrl: requestedUrl, reqId: data.id});
  reqLog.info({
    data: data
  }, 'Incoming request to process url');

  var now = new Date();
  var writeName = data.id + '.png';
  var fileName = data.host + data.path + '_' + now.getTime() + '.png';
  var thumbFileName = data.host + data.path + '_' + now.getTime() + '_thumb.png';

  var screenStream = shot.getCaptureStream(requestedUrl);
  screenStream.on('error', function onErr (err) {
    reqLog.error({
      err: err
    }, 'screenStream error');
    return callback(err);
  });
  var writeFile = fs.createWriteStream(writeName);

  pump(screenStream, writeFile, function (err) {
    if (err) {
      reqLog.error({
        err: err
      }, 'Error writing screenStream to file');
      return callback(err);
    }
    reqLog.info('Done writing screenStream to file');
    var uploadFile = fs.createReadStream(writeName);
    var resizeFile = fs.createReadStream(writeName);

    var resizeStream = resize(thumbFileName);
    resizeStream.on('error', function onErr (err) {
      reqLog.error({
        err: err,
        thumbFileName: thumbFileName
      }, 'Error resizing image');
      return callback(err);
    });

    var resizePump = pumpify(resizeFile, resizeStream);
    async.parallel({
      thumbnailImage: async.apply(upload, thumbFileName, resizePump, reqLog),
      originalImage: async.apply(upload, fileName, uploadFile, reqLog)
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
      fs.unlink(writeName, function (err) {
        if (err) {
          reqLog.error({
            err: err,
            fileName: writeName
          }, 'Unable to remove file');
        }
        reqLog.info({
          fileName: writeName
        }, 'Successfully removed file');
      });
      data.status = 'SUCCESSFUL';
      data.originalImage = results.originalImage;
      data.thumbnailImage = results.thumbnailImage;
      reqLog.info(data, 'Successfully uploaded snapshots');
      return callback(null, data);
    });
  });
};

function upload (fileName, inputStream, reqLog, callback) {
  reqLog.info({
    fileName: fileName
  }, 'attempting to upload file');
  var gStream = gfs.uploadStream(fileName);
  pump(inputStream, gStream, function onPumpError (err) {
    if (err) {
      reqLog.error({
        err: err,
        fileName: fileName
      }, 'Upload of file failed');
      return callback(err);
    }
    reqLog.info({
      fileName: fileName
    }, 'Upload of file was successful');
    return callback(null, gfs.uploadUrl(fileName));
  });
}
