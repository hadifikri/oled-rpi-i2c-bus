const SSD1306 = require('./drivers/ssd1306');
const SH1106 = require('./drivers/sh1106');
const fs = require('fs');
const PNG = require('pngjs').PNG;

var pdxb = null;
var pdyb = null;
var timers = [];

var Oled = function (i2c, opts) {
    this.DRIVER = opts.driver || "SSD1306";
    this.HEIGHT = opts.height || 64;
    this.WIDTH = opts.width || 128;

    switch (this.DRIVER) {
        case "SSD1306":
            this.api = new SSD1306(i2c, opts);
            break;
        case "SH1106":
            this.api = new SH1106(i2c, opts);
            break;
        default:
            throw new Error("Unknown Driver");
    }

}

/* ######################################################################
 * OLED Controls
 * ######################################################################
 */
// turn oled on
Oled.prototype.turnOnDisplay = function () {
    this.api.turnOnDisplay();
}

// turn oled off
Oled.prototype.turnOffDisplay = function () {
    this.api.turnOffDisplay();
}

// send dim display command to oled
Oled.prototype.dimDisplay = function (bool) {
    this.api.dimDisplay(bool);
}

// invert pixels on oled
Oled.prototype.invertDisplay = function (bool) {
    this.api.invertDisplay(bool);
}

// activate scrolling for rows start through stop
Oled.prototype.startScroll = function (dir, start, stop) {
    this.api.startScroll(dir, start, stop);
}

// stop scrolling display contents
Oled.prototype.stopScroll = function () {
    this.api.stopScroll();
}

// send the entire framebuffer to the oled
Oled.prototype.update = function () {
    // wait for oled to be ready
    this.api.update();
}

/* ######################################################################
 * OLED Drawings
 * ######################################################################
 */

// clear all pixels currently on the display
Oled.prototype.clearDisplay = function (sync) {
    this.api.clearDisplay(sync);
}

// set starting position of a text string on the oled
Oled.prototype.setCursor = function (x, y) {
    this.api.setCursor(x, y);
}

Oled.prototype.drawPageCol = function (page, col, byte) {
    this.api.drawPageCol(page, col, byte);
}

// buffer/ram test
Oled.prototype.drawPageSeg = function (page, seg, byte, sync) {
    this.api.drawPageSeg(page, seg, byte, sync);
}

// draw one or many pixels on oled
Oled.prototype.drawPixel = function (pixels, sync) {
    this.api.drawPixel(pixels, sync);
}

// using Bresenham's line algorithm
Oled.prototype.drawLine = function (x0, y0, x1, y1, color, sync) {
    this.api.drawLine(x0, y0, x1, y1, color, sync);
}

// draw a filled rectangle on the oled
Oled.prototype.fillRect = function (x, y, w, h, color, sync) {
    this.api.fillRect(x, y, w, h, color, sync);
}

// write text to the oled
Oled.prototype.writeString = function (font, size, string, color, wrap, sync) {
    this.api.writeString(font, size, string, color, wrap, sync);
}

// draw an RGBA image at the specified coordinates
Oled.prototype.drawRGBAImage = function (image, dx, dy, sync) {
    this.api.drawRGBAImage(image, dx, dy, sync);
}

// draw an image pixel array on the screen
Oled.prototype.drawBitmap = function (pixels, sync) {
    this.api.drawBitmap(pixels, sync);
}

/* ######################################################################
 * OLED Shape/Indicators
 * ######################################################################
 */

Oled.prototype.battery = function (x, y, percentage) {
    this.drawLine(x, y, x + 16, y, 1)
    this.drawLine(x, y + 8, x + 16, y + 8, 1)
    this.drawLine(x, y, x, y + 8, 1)
    this.drawPixel([[x + 17, y + 1, 1], [x + 17, y + 7, 1]])
    this.drawLine(x + 18, y + 1, x + 18, y + 7, 1)

    if (percentage >= 70) {
        this.fillRect(x + 2, y + 2, 3, 5, 1, false)
        this.fillRect(x + 7, y + 2, 3, 5, 1, false)
        this.fillRect(x + 12, y + 2, 3, 5, 1, true)
    }

    if (percentage >= 40 && percentage < 70) {
        this.fillRect(x + 2, y + 2, 3, 5, 1, false)
        this.fillRect(x + 7, y + 2, 3, 5, 1, false)
        this.fillRect(x + 12, y + 2, 3, 5, 0, true)
    }

    if (percentage >= 10 && percentage < 40) {
        this.fillRect(x + 2, y + 2, 3, 5, 1, false)
        this.fillRect(x + 7, y + 2, 3, 5, 0, false)
        this.fillRect(x + 12, y + 2, 3, 5, 0, true)
    }

    if (percentage < 10) {
        this.fillRect(x + 2, y + 2, 3, 5, 0, false)
        this.fillRect(x + 7, y + 2, 3, 5, 0, false)
        this.fillRect(x + 12, y + 2, 3, 5, 0, true)
    }
}

Oled.prototype.bluetooth = function (x, y) {
    this.drawLine(x + 5, y + 1, x + 5, y + 11, 1)
    this.drawLine(x + 2, y + 3, x + 9, y + 8, 1)
    this.drawLine(x + 2, y + 9, x + 8, y + 3, 1)
    this.drawLine(x + 5, y + 1, x + 9, y + 3, 1)
    this.drawLine(x + 5, y + 11, x + 8, y + 9, 1)
}

Oled.prototype.wifi = function (x, y, percentage) {
    this.drawLine(x, y, x + 8, y, 1)
    this.drawLine(x, y, x + 4, y + 4, 1)
    this.drawLine(x + 8, y, x + 4, y + 4, 1)
    this.drawLine(x + 4, y, x + 4, y + 9, 1)

    if (percentage >= 70) {
        this.fillRect(x + 6, y + 8, 2, 2, 1, true)
        this.fillRect(x + 10, y + 6, 2, 4, 1, true)
        this.fillRect(x + 14, y + 4, 2, 6, 1, true)
    }

    if (percentage >= 40 && percentage < 70) {
        this.fillRect(x + 6, y + 8, 2, 2, 1, true)
        this.fillRect(x + 10, y + 6, 2, 4, 1, true)
        this.fillRect(x + 14, y + 4, 2, 6, 0, true)
    }

    if (percentage >= 10 && percentage < 40) {
        this.fillRect(x + 6, y + 8, 2, 2, 1, true)
        this.fillRect(x + 10, y + 6, 2, 4, 0, true)
        this.fillRect(x + 14, y + 4, 2, 6, 0, true)
    }

    if (percentage < 10) {
        this.fillRect(x + 6, y + 8, 2, 2, 0, true)
        this.fillRect(x + 10, y + 6, 2, 4, 0, true)
        this.fillRect(x + 14, y + 4, 2, 6, 0, true)
    }
}

Oled.prototype.image = function (x, y, image, font, clear, reset, animated, wrapping) {

    var dirresources = __dirname + "/resources/";
    // console.log(dirresources)
    if (typeof reset === 'boolean' && reset) {
        timers.forEach(function (entry) {
            clearInterval(entry);
            entry = null;
        });
        timers = [];
        if (typeof clear === 'boolean' && clear) {
            this.clearDisplay();
        }
        if (typeof pdxb === 'number') { pdxb = null }
        if (typeof pdyb === 'number') { pdyb = null }
        return
    }

    if (typeof image === 'string' && !image.includes("/")) {
        tryImage = image;
        image = dirresources + image;
    }

    try {
        if (!fs.statSync(image).isFile()) {
            console.log("file " + image + "not exist.");
        }
    } catch (err) {
        image = dirresources + "notafile.png";
        x = 0;
        y = 17;
        this.clearDisplay();
        this.writeString(font, 1, tryImage, 1, wrapping)
    }

    if (typeof clear === 'boolean' && clear) {
        this.clearDisplay();
    }

    try {
        const _oled = this;
        fs.createReadStream(image)
            .pipe(new PNG({ filterType: 4 }))
            .on('parsed', function () {
                if (typeof animated === 'boolean' && animated) {
                    pdxb = 1;
                    pdyb = -1;
                    try {
                        let myInterval = setInterval(() => { _drawPseudo(_oled, clear, this, pdxb, pdyb) }, 10);
                        timers.push(myInterval);
                    } catch (e) { console.log(e) }

                }
                else {
                    _oled.api.drawRGBAImage(this, x || Math.floor((_oled.WIDTH - this.width) / 2), y || Math.floor((_oled.HEIGHT - this.height) / 2), true);
                }
            });
    } catch (err) {
        console.error(err)
    }
}

function _drawPseudo(display, clear, image, pdxb, pdyb) {
    var image;
    if (typeof this.init === "undefined" || this.init === true || this.image !== image) {
        this.init = false;
        this.image = image;
        this.x = 1;
        this.y = 1;
        this.prevX = 1;
        this.prevY = 1;
        this.dx = pdxb;
        this.dy = pdyb;
        //console.log("entra drawPseudo this.x " + this.x + " this.y " + this.y + " this.dx " + this.dx + " this.dy " + this.dy);
    }
    if (clear) {
        display.fillRect(0, 0, display.WIDTH, display.HEIGHT, 1, true)
        display.fillRect(1, 1, display.WIDTH - 2, display.HEIGHT - 2, 0, true)

    } else {
        display.fillRect(this.prevX, this.prevY, image.width, image.height, 0, false);
        this.prevX = this.x;
        this.prevY = this.y;
        // display.fillRect(0,0,display.WIDTH , display.HEIGHT ,1,true)
        // display.fillRect(1,1,display.WIDTH - 2, display.HEIGHT - 2 ,0,true)
    }

    display.drawRGBAImage(image, this.x, this.y, true);
    if (this.x + this.dx > display.WIDTH - image.width || this.x < 1) {
        this.dx = -this.dx;
    }
    if (this.y + this.dy > display.HEIGHT - image.height || this.y < 1) {
        this.dy = -this.dy;
    }

    this.x += this.dx;
    this.y += this.dy;
}

module.exports = Oled;
