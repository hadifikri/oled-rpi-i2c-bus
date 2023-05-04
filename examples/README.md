
OLED JS Pi over i2c-bus
========================

## What is this directory?

This directory contains a working example of NodeJS, a (typically) ARM board (Orange Pi Zero), and a 128x64 I2C SSD1306 and SH1106 display.

Raspberry Pi allows for software I2C. To enable software I2C, add `dtoverlay=i2c-gpio,bus=3` to `/boot.config.txt`. The software I2C would be available on `bus` no `3` 
where the `SDA` is on pin `GPIO23`/`BCM 16` and `SCK` is on pun `GPIO24`/`BCM 18`. In this examples, the `SSD1306` is using the hardware I2C on bus `1` while the `SH1106` 
is using software I2C on bus `3`. 

## Install

```
git clone
cd /git/directory
npm install
cd examples
npm install
node ./ssd1306_clock.js
node ./sh1106_clock.js
```
