var webshot = require('screenshot-stream');

var api = module.exports = {};

api.getCaptureStream = function getCaptureStream (url, size, options) {
  size = size || '1600x1200';
  options = options || {
    crop: true
  };
  return webshot(url, size, options);
};
