/*
 * clock.js
 * Display a digital clock on a small I2C connected display
 * 
 * 2016-11-28 v1.0 Harald Kubota
 */


"use strict";

// NOTE: On newer versions of Raspberry Pi the I2C is set to 1,
// however on other platforms you may need to adjust if to
// another value, for example 0.
var bus = 1;

var i2c = require('i2c-bus'),
    i2cBus = i2c.openSync(bus),
    oled = require('oled-i2c-bus');

const SIZE_X=128,
      SIZE_Y=64;

var opts = {
  width: SIZE_X,
  height: SIZE_Y,
  address: 0x3C
};


try {
  var oled = new oled(i2cBus, opts);

  oled.clearDisplay();
  oled.turnOnDisplay();

  oled.drawPixel([
    [SIZE_X-1, 0, 1],
    [SIZE_X-1, SIZE_Y-1, 1],
    [0, SIZE_Y-1, 1],
    [0, 0, 1]
  ]);

  oled.drawLine(1, 1, SIZE_X-2, 1, 1);
  oled.drawLine(SIZE_X-2, 1, SIZE_X-2, SIZE_Y-2, 1);
  oled.drawLine(SIZE_X-2, SIZE_Y-2, 1, SIZE_Y-2, 1);
  oled.drawLine(1, SIZE_Y-2, 1, 1, 1);
}
catch(err) {
  // Print an error message and terminate the application
  console.log(err.message);
  process.exit(1);
}

var font = require('oled-font-5x7');

// Clock

function displayClock() {
  var date=new Date();
  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;
  var min  = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;
  var sec  = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;

  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;
  var day  = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  oled.setCursor(12, Math.floor(SIZE_Y/2) + 7);
  oled.writeString(font, 2, hour+":"+min+":"+sec, 1, true);
}

setInterval(displayClock, 1000);

