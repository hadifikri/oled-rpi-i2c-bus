"use strict";

// NOTE: On newer versions of Raspberry Pi the I2C is set to 1 for hardware I2C and 3 for software I2C,
// however on other platforms you may need to adjust if to
// another value, for example 0.
const i2c = require('i2c-bus');
const display = require('../../oled');

const HEIGHT = 64;
const WIDTH = 128;
var opts = {
  width: WIDTH,
  height: HEIGHT,
  address: 0x3C,
  bus: 3,
  driver: 'SH1106'
};

try {
  const i2cBus = i2c.openSync(opts.bus);
  var oled = new display(i2cBus, opts);
  oled.clearDisplay(true);

  var p = 0, s = 0;
  oled.drawPageSeg(p, s, 0xFF, 1,false);
  oled.update();
  setInterval(() => {
    oled.drawPageSeg(p, s, 0x00, false);
    if (s + 1 >= WIDTH) {
      p = (p + 1) % 8;
    }
    s = (s + 1) % WIDTH;
    oled.drawPageSeg(p, s, 0xFF, 1,false);
    oled.update();
  }, 10);

}
catch (err) {
  // Print an error message and terminate the application
  console.log(err.message);
  process.exit(1);
}





