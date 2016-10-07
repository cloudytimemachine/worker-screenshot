var sharp = require('sharp');

module.exports = function resize (fileName) {
  return sharp()
    .resize(300, 300)
    .min();
};
