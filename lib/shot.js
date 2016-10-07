var webshot = require('webshot');

var api = module.exports = {};

api.getCaptureStream = function getCaptureStream (url, options) {
  options = options || {
    screenSize: {
      width: 1600,
      height: 2000
    },
    shotSize: {
      width: 'all',
      height: 'all'
    },
    phantomConfig: {
      'ignore-ssl-errors': 'true'
    }
  };
  return webshot(url, options);
};
