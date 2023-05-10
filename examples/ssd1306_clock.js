
"use strict";

// NOTE: On newer versions of Raspberry Pi the I2C is set to 1 for hardware I2C and 3 for software I2C,
// however on other platforms you may need to adjust if to
// another value, for example 0.
const i2c = require('i2c-bus');
const display = require('../oled');
const font = require('oled-font-pack');

const HEIGHT = 64;
const WIDTH = 128;
var opts = {
    width: WIDTH,
    height: HEIGHT,
    address: 0x3C,
    bus: 1,
    driver: 'SSD1306'
};

var battery = 0;
var signal = 0;
var _oled;
try {
    const i2cBus = i2c.openSync(opts.bus);
    var oled = new display(i2cBus, opts);
    _oled = oled;
    oled.clearDisplay(true);

    
    oled.drawLine(0,0,WIDTH-1,0,1,false);
    oled.drawLine(0,HEIGHT-1,WIDTH-1,HEIGHT-1,1,false);
    oled.drawLine(0,0,0,HEIGHT-1,1,false);
    oled.drawLine(WIDTH-1,0,WIDTH-1,HEIGHT-1,1,false);
    oled.bluetooth(25,2);
    
    oled.image(54,3,"OledImage.png",font.oled_5x7,false,false,false,false);
    setInterval(displayClock, 1000);
}
catch (err) {
    // Print an error message and terminate the application
    console.log(err);
    process.exit(1);
}


function displayClock() {
  var date = new Date();
  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;
  var min = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;
  var sec = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;

  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;
  var day = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  oled.setCursor(20, Math.floor(HEIGHT / 2) +5);
  oled.writeString(font.oled_5x7, 2, hour + ":" + min + ":" + sec, 1, true);
  
  battery = (battery+20)%100;
  signal = (signal+20)%100;
  oled.battery(5,4,battery);
  oled.wifi(105,2,signal);
}