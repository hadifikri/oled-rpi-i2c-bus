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

var percentage = 0;
try {
    const i2cBus = i2c.openSync(opts.bus || 3);
    var oled = new display(i2cBus, opts);

    oled.clearDisplay(true);
    oled.battery(5,4,percentage);
    setInterval(update, 1000);
}
catch (err) {
    // Print an error message and terminate the application
    console.log(err.message);
    process.exit(1);
}

function update() {
    percentage = (percentage+20)%100;
    oled.battery(5,4,percentage);
  }



