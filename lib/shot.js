var webshot = require('screenshot-stream');

var api = module.exports = {};

api.getCaptureStream = function getCaptureStream (url, size, options) {
  size = size || '1600x1200';
  options = options || {
    crop: true,
    delay: process.env.DELAY || 10,
    userAgent: process.env.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36'
  };
  return webshot(url, size, options);
};
