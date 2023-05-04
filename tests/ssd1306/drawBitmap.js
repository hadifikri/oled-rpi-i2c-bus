"use strict";

// NOTE: On newer versions of Raspberry Pi the I2C is set to 1 for hardware I2C and 3 for software I2C,
// however on other platforms you may need to adjust if to
// another value, for example 0.
const i2c = require('i2c-bus');
const display = require('../../oled');
const pngparse = require('pngparse');
const path = require('path');

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
    const image_file = path.join(__dirname,'../../resources','icon_128x64_kiss.png');
    pngparse.parseFile(image_file, function(err, image) {
        if(err){
            process.exit(1);
        }
        oled.drawBitmap(image.data,true);
    });
}
catch (err) {
    // Print an error message and terminate the application
    console.log(err.message);
    process.exit(1);
}

