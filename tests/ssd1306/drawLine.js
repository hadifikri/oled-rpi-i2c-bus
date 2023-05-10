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
    address: 0x3C
};

try {
    const i2cBus = i2c.openSync(opts.bus || 1);
    var oled = new display(i2cBus, opts);

    oled.clearDisplay(true);
    
    oled.drawLine(0,0,WIDTH-1,0,1,false);
    oled.drawLine(0,HEIGHT-1,WIDTH-1,HEIGHT-1,1,false);
    oled.drawLine(0,1,0,HEIGHT-2,1,true);
    oled.drawLine(WIDTH-1,1,WIDTH-1,HEIGHT-2,1,false);
    
    oled.drawLine(1,1,WIDTH-2,HEIGHT-2,1,false);
    oled.drawLine(WIDTH-2,2,2,HEIGHT-2,1,true);
}
catch (err) {
    // Print an error message and terminate the application
    console.log(err.message);
    process.exit(1);
}





