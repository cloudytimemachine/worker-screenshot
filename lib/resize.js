var sharp = require('sharp');

module.exports = function resize(fileName) {
  return sharp()
    .resize(300, 300)
    .min()
    .on('info', function(info) {
      console.log('image height is ', info.height);
    });
}
