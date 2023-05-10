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
    address: 0x3C,
    bus: 3,
    driver: 'SH1106'
};

try {
    const i2cBus = i2c.openSync(opts.bus);
    var oled = new display(i2cBus, opts);

    oled.clearDisplay(true);
    
    oled.setCursor(10,0);
    oled.writeString(font.oled_5x7,1,"Hello",1,false,false);
    oled.setCursor(10,10);
    oled.writeString(font.oled_5x7,2,"Hello",1,false,false);
    oled.setCursor(10,40);
    oled.writeString(font.oled_3x5,1,"Hello",1,false,false);
    oled.setCursor(10,50);
    oled.writeString(font.oled_3x5,2,"Hello",1,false,false);
    oled.setCursor(70,40);
    oled.writeString(font.oled_3x5,3,"Hello",1,false,true);
}
catch (err) {
    // Print an error message and terminate the application
    console.log(err.message);
    process.exit(1);
}





