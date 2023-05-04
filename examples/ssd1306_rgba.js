/*
 * rgba.js
 * Display an RGBA image at random locations on a small I2C connected display
 *
 * 2018-08-19 v1.0 Bryan Nielsen
 */


"use strict";

const fs = require('fs');
const PNG = require('pngjs').PNG;
const i2c = require('i2c-bus');
const oled = require('../oled');// 'oled-i2c-bus');

var opts = {
  width: 128,
  height: 64,
  address: 0x3C,
  bus:1,
  driver: 'SSD1306'
};

var i2cBus = i2c.openSync(opts.bus);
var display = new oled(i2cBus, opts);
display.clearDisplay();
display.turnOnDisplay();

fs.createReadStream('./test.png')
.pipe(new PNG({ filterType: 4 }))
.on('parsed', function () {
  setInterval(() => { drawImage(this) }, 1000);
});

function drawImage(image) {
  let x = Math.floor(Math.random() * (display.WIDTH) - image.width / 2);
  let y = Math.floor(Math.random() * (display.HEIGHT) - image.height / 2);
  display.drawRGBAImage(image, x, y);
}
