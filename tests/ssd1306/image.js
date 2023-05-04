"use strict";

// NOTE: On newer versions of Raspberry Pi the I2C is set to 1 for hardware I2C and 3 for software I2C,
// however on other platforms you may need to adjust if to
// another value, for example 0.
const i2c = require('i2c-bus');
const display = require('../../oled');
const font = require('oled-font-pack');

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
    oled.image(0,0,"WaterBrain.png",font.oled_5x7,false,false,true,false);
    setTimeout(()=>{
        oled.image(0,0,"",font.oled_5x7,true,true,false,false);
        oled.image(30,3,"rpi-frambuesa.png",font.oled_5x7,true,false,false,false);
    },5000);
}
catch (err) {
    // Print an error message and terminate the application
    console.log(err.message);
    process.exit(1);
}

