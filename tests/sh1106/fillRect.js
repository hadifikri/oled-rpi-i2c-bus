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
    
    oled.fillRect(0,0,7,5,1,false);
    oled.fillRect(WIDTH-7,0,7,5,1,false);
    oled.fillRect(0,HEIGHT-5,7,5,1,false);
    oled.fillRect(WIDTH-7,HEIGHT-5,7,5,1,false);

    oled.fillRect(7,5,114,54,1,true);
}
catch (err) {
    // Print an error message and terminate the application
    console.log(err.message);
    process.exit(1);
}





