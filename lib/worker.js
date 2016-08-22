var gfs = require('./gfs');
var url = require('url');
var shot = require('./shot');
var Jimp = require('jimp');
var fs = require('fs');

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

  var buf = new Buffer([]);
  screenStream.on('data', function(d) {
    buf = Buffer.concat([buf, d]);
  });

  var now = new Date();
  var parsed = url.parse(requestedUrl);
  console.log(parsed);
  var fileName = parsed.hostname + parsed.path + '_' + now.getTime() + '.png';
  var thumbFileName = parsed.hostnane + '_' + now.getTime() + 'thumb.png';

  screenStream.on('end', function onEnd () {
    console.log('screenStream end');
    Jimp.read(buf, function(err, image) {
      image.scale(0.15).write(thumbfileName, function(err, result) {
        console.log('wrote file! : ' + thumbFileName);
      });
    });
  });

  console.log('attempting to upload', fileName);

  gfs.upload(fileName, screenStream, function (err, results) {
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

