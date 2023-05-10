"use strict";

// NOTE: On newer versions of Raspberry Pi the I2C is set to 1 for hardware I2C and 3 for software I2C,
// however on other platforms you may need to adjust if to
// another value, for example 0.
const i2c = require('i2c-bus');
const display = require('../../oled');
const path = require("path");
const dirresources = path.join(__dirname,"../..","resources/");
var fs = require('fs');
var PNG = require('pngjs').PNG;

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
    const piLogo = "rpi-frambuesa.png";
    var image;
    if (typeof piLogo === 'string' && !piLogo.includes("/")) {
        image = dirresources + piLogo;
    } else {
        console.log("Invalid image filename");
        process.exit(1);
    }
    if (!fs.statSync(image).isFile()) {
        console.log("file " + image + "not exist.");
        process.exit(1);
    }
    fs.createReadStream(image)
        .pipe(new PNG({ filterType: 4 }))
        .on('parsed', function () {
            oled.drawRGBAImage(
                this, 
                Math.floor((WIDTH - this.width) / 2),  //x-pos center width
                Math.floor((HEIGHT - this.height) / 2),//y-pos center height
                true
            );
            setTimeout(()=>{
                oled.turnOffDisplay();
            },2000)
            setTimeout(()=>{
                oled.turnOnDisplay();
            },3000)
            setTimeout(()=>{
                oled.dimDisplay(true);
            },4000)
            setTimeout(()=>{
                oled.dimDisplay(false);
            },5000)
            setTimeout(()=>{
                oled.invertDisplay(true);
            },6000)
            setTimeout(()=>{
                oled.invertDisplay(false);
            },7000);
            setTimeout(()=>{
                oled.startScroll("right",0,127);
            },8000);
            setTimeout(()=>{
                oled.stopScroll();
            },17000)
        });
}
catch (err) {
    // Print an error message and terminate the application
    console.log(err.message);
    process.exit(1);
}





