
var SH1106 = function (i2c, opts) {
    this.HEIGHT = opts.height || 64;
    this.WIDTH = opts.width || 128;
    this.ADDRESS = opts.address || 0x3C;

    this.MAX_PAGE_COUNT = this.HEIGHT / 8;
    this.LINESPACING = typeof opts.linespacing !== 'undefined' ? opts.linespacing : 1;
    this.LETTERSPACING = typeof opts.letterspacing !== 'undefined' ? opts.letterspacing : 1;

    var config = {
        '128x32': {
            'multiplex': 0x1F,
            'compins': 0x02,
            'coloffset': 0x02 
        },
        '128x64': {
            'multiplex': 0x3F,
            'compins': 0x12,
            'coloffset': 0x02
        },
        '96x16': {
            'multiplex': 0x0F,
            'compins': 0x02,
            'coloffset': 0x02,
        }
    };

    var screenSize = this.WIDTH + 'x' + this.HEIGHT;
    this.screenConfig = config[screenSize];

    // create command buffers
    this.DISPLAY_OFF = 0xAE;
    this.DISPLAY_ON = 0xAF;
    this.SET_DISPLAY_CLOCK_DIV = 0xD5;
    this.SET_MULTIPLEX = 0xA8;
    this.SET_DISPLAY_OFFSET = 0xD3;
    this.SET_START_LINE = 0x40;
    this.CHARGE_PUMP = 0xAD;
    this.EXTERNAL_VCC = false;
    this.MEMORY_MODE = 0x20;
    this.SEG_REMAP = 0xA1;
    this.COM_SCAN_DEC = 0xC8;
    this.COM_SCAN_INC = 0xC0;
    this.SET_COM_PINS = 0xDA;
    this.SET_CONTRAST = 0x81;
    this.SET_PRECHARGE = 0xD9;
    this.SET_VCOM_DETECT = 0xDB;
    this.DISPLAY_ALL_ON_RESUME = 0xA4;
    this.NORMAL_DISPLAY = 0xA6;
    this.COLUMN_LOW_START_ADDR = 0x02;
    this.COLUMN_HIGH_START_ADDR = 0x10;
    this.PAGE_ADDR = 0xB0;
    this.INVERT_DISPLAY = 0xA7;
    this.SET_CONTRAST_CTRL_MODE = 0x81;

    this.cursor_x = 0;
    this.cursor_y = 0;

    // new blank buffer (1 byte per pixel)
    //For version <6.0.0
    if (typeof Buffer.alloc == "undefined") {
        this.buffer = new Buffer((this.WIDTH * this.HEIGHT) / 8);
    }
    //For version >=6.0.0
    else {
        this.buffer = Buffer.alloc((this.WIDTH * this.HEIGHT) / 8);
    }
    this.buffer.fill(0xFF);
    this.dirtyBytes = [];

    this.wire = i2c;
    this._initialise();
}

/* ##################################################################################################
 * OLED controls
 * ##################################################################################################
 */
// turn oled on
SH1106.prototype.turnOnDisplay = function () {
    this._transfer('cmd', this.DISPLAY_ON);
}

// turn oled off
SH1106.prototype.turnOffDisplay = function () {
    this._transfer('cmd', this.DISPLAY_OFF);
}

// send dim display command to oled
SH1106.prototype.dimDisplay = function (bool) {
    var contrast;

    if (bool) {
        contrast = 0; // Dimmed display
    } else {
        contrast = 0xFF; // Bright display
    }

    this._transfer('cmd', this.SET_CONTRAST_CTRL_MODE);
    this._transfer('cmd', contrast);
}

// invert pixels on oled
SH1106.prototype.invertDisplay = function (bool) {
    if (bool) {
        this._transfer('cmd', this.INVERT_DISPLAY); // inverted
    } else {
        this._transfer('cmd', this.NORMAL_DISPLAY); // non inverted
    }
}

// activate scrolling for rows start through stop
SH1106.prototype.startScroll = function (dir, start, stop) {
    console.log("SH1106 do not support this command");
}

// stop scrolling display contents
SH1106.prototype.stopScroll = function () {
    console.log("SH1106 do not support this command");
}

// send the entire framebuffer to the oled
SH1106.prototype.update = function () {
    // wait for oled to be ready
    this._waitUntilReady(function () {
        // set the start and endbyte locations for oled display update
        for (var pageIdx = 0; pageIdx <= this.MAX_PAGE_COUNT; pageIdx++) {
            const displaySeq = [
                this.PAGE_ADDR + pageIdx,
                this.COLUMN_LOW_START_ADDR,
                this.COLUMN_HIGH_START_ADDR,
            ];
            // send intro seq
            for (var i = 0; i < displaySeq.length; i += 1) {
                this._transfer('cmd', displaySeq[i]);
            }
            const start = pageIdx * this.WIDTH;
            const end = start + this.WIDTH;

            //For version <6.0.0
            if (typeof this.buffer.subarray == "undefined") {
                var pagedBuffer = this.buffer.slice(start, end)
            }
            //For version >=6.0.0
            else {
                var pagedBuffer = this.buffer.subarray(start, end)
            }
            for (var i = 0; i < pagedBuffer.length; i++) {
                this._transfer('data', pagedBuffer[i]);
            }
        }
    }.bind(this));
}

/* ##################################################################################################
 * OLED drawings
 * ##################################################################################################
 */

// clear all pixels currently on the display
SH1106.prototype.clearDisplay = function (sync) {
    for (let i = 0; i < this.buffer.length; i += 1) {
        if (this.buffer[i] !== 0x00) {
            this.buffer[i] = 0x00;
            if (this.dirtyBytes.indexOf(i) === -1) {
                this.dirtyBytes.push(i);
            }
        }
    }
    if (sync) {
        this._updateDirtyBytes(this.dirtyBytes);
    }
}

// set starting position of a text string on the oled
SH1106.prototype.setCursor = function (x, y) {
    this.cursor_x = x;
    this.cursor_y = y;
}

// buffer/ram test
SH1106.prototype.drawPageCol = function (page, col, byte) {
    // wait for oled to be ready
    this._waitUntilReady(function () {
        // set the start and endbyte locations for oled display update
        var bufferIndex = col + (page * this.WIDTH);
        this.buffer[bufferIndex] = byte;

        // Ensure that column is only 0..127.
        col &= 0x7F;
        col += this.screenConfig.coloffset; // Column Bias for a SH1106.

        var lowAddress = (col & 0x0F);
        var highAddress = this.COLUMN_HIGH_START_ADDR | (col >>> 4);
        var displaySeq = [
            this.PAGE_ADDR + page,
            lowAddress,
            highAddress
        ];

        for (var v = 0; v < displaySeq.length; v += 1) {
            this._transfer('cmd', displaySeq[v]);
        }
        this._transfer('data', this.buffer[bufferIndex]);

    }.bind(this));
}

SH1106.prototype.drawPageSeg = function (page, seg, byte, sync) {
    if (page < 0 || page >= this.MAX_PAGE_COUNT || seg < 0 || seg >= this.WIDTH) {
        return
    }
    // wait for oled to be ready
    this._waitUntilReady(function () {
        // set the start and endbyte locations for oled display update
        var bufferIndex = seg + (page * this.WIDTH);
        // console.log(`drawPageSeg -> page:${page}, seg:${seg}, index:${bufferIndex}, byte:${byte.toString(2)}`);

        this.buffer[bufferIndex] = byte;
        if (this.dirtyBytes.indexOf(bufferIndex) === -1) {
            this.dirtyBytes.push(bufferIndex);
        }
        if (sync) {
            this._updateDirtyBytes(this.dirtyBytes);
        }
    }.bind(this));
}

// draw one or many pixels on oled
SH1106.prototype.drawPixel = function (pixels, sync) {
    // handle lazy single pixel case
    if (typeof pixels[0] !== 'object') {
        pixels = [pixels];
    }

    pixels.forEach(function (el) {
        // return if the pixel is out of range
        const x = el[0];
        const y = el[1];
        const color = el[2];

        if (x < 0 || x >= this.WIDTH || y < 0 || y >= this.HEIGHT) {
            return;
        }

        // thanks, Martin Richards.
        // I wanna can this, this tool is for devs who get 0 indexes
        // x -= 1; y -=1;
        let byte = 0;
        const page = Math.floor(y / 8);
        const pageShift = 0x01 << (y - 8 * page);

        // is the pixel on the first row of the page?
        if (page === 0) {
            byte = x;
        } else {
            byte = x + (this.WIDTH * page);
        }

        // colors! Well, monochrome.
        if (color === 'BLACK' || !color) {
            this.buffer[byte] &= ~pageShift;
        } else if (color === 'WHITE' || color) {
            this.buffer[byte] |= pageShift;
        }

        // push byte to dirty if not already there
        if (this.dirtyBytes.indexOf(byte) === -1) {
            this.dirtyBytes.push(byte);
        }
    }, this);

    if (sync) {
        this._updateDirtyBytes(this.dirtyBytes);
    }
}

// using Bresenham's line algorithm
SH1106.prototype.drawLine = function (x0, y0, x1, y1, color, sync) {
    var immed = (typeof sync === 'undefined') ? true : sync;

    var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1,
        dy = Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1,
        err = (dx > dy ? dx : -dy) / 2;

    while (true) {
        this.drawPixel([x0, y0, color], false);

        if (x0 === x1 && y0 === y1) break;

        var e2 = err;

        if (e2 > -dx) { err -= dy; x0 += sx; }
        if (e2 < dy) { err += dx; y0 += sy; }
    }

    if (immed) {
        this._updateDirtyBytes(this.dirtyBytes);
    }
}

// draw a filled rectangle on the oled
SH1106.prototype.fillRect = function (x, y, w, h, color, sync) {
    var immed = (typeof sync === 'undefined') ? true : sync;
    // one iteration for each column of the rectangle
    for (var i = x; i < x + w; i += 1) {
        // draws a vert line
        this.drawLine(i, y, i, y + h - 1, color, false);
    }
    if (immed) {
        this._updateDirtyBytes(this.dirtyBytes);
    }
}

// write text to the oled
SH1106.prototype.writeString = function (font, size, string, color, wrap, sync) {
    var immed = (typeof sync === 'undefined') ? true : sync;
    var wordArr = string.split(' '),
        len = wordArr.length,
        // start x offset at cursor pos
        offset = this.cursor_x,
        padding = 0;

    // loop through words
    for (var w = 0; w < len; w += 1) {
        // put the word space back in for all in between words or empty words
        if (w < len - 1 || !wordArr[w].length) {
            wordArr[w] += ' ';
        }
        var stringArr = wordArr[w].split(''),
            slen = stringArr.length,
            compare = (font.width * size * slen) + (size * (len - 1));

        // wrap words if necessary
        if (wrap && len > 1 && w > 0 && (offset >= (this.WIDTH - compare))) {
            offset = 0;

            this.cursor_y += (font.height * size) + this.LINESPACING;
            this.setCursor(offset, this.cursor_y);
        }

        // loop through the array of each char to draw
        for (var i = 0; i < slen; i += 1) {
            if (stringArr[i] === '\n') {
                offset = 0;
                this.cursor_y += (font.height * size) + this.LINESPACING;
                this.setCursor(offset, this.cursor_y);
            }
            else {
                // look up the position of the char, pull out the buffer slice
                var charBuf = this._findCharBuf(font, stringArr[i]);
                // read the bits in the bytes that make up the char
                var charBytes = this._readCharBytes(charBuf, font.height);
                // draw the entire character
                this._drawChar(charBytes, font.height, size, false);

                // calc new x position for the next char, add a touch of padding too if it's a non space char
                //padding = (stringArr[i] === ' ') ? 0 : this.LETTERSPACING;
                offset += (font.width * size) + this.LETTERSPACING;// padding;

                // wrap letters if necessary
                if (wrap && (offset >= (this.WIDTH - font.width - this.LETTERSPACING))) {
                    offset = 0;
                    this.cursor_y += (font.height * size) + this.LINESPACING;
                }
                // set the 'cursor' for the next char to be drawn, then loop again for next char
                this.setCursor(offset, this.cursor_y);
            }
        }
    }
    if (immed) {
        this._updateDirtyBytes(this.dirtyBytes);
    }
}

// draw an RGBA image at the specified coordinates
SH1106.prototype.drawRGBAImage = function (image, dx, dy, sync) {
    var immed = (typeof sync === 'undefined') ? true : sync;
    // translate image data to buffer
    var x, y, dataIndex, buffIndex, buffByte, bit, pixelByte;
    var dyp = this.WIDTH * Math.floor(dy / 8); // calc once
    var dxyp = dyp + dx;
    for (x = 0; x < image.width; x++) {
        var dxx = dx + x;
        if (dxx < 0 || dxx >= this.WIDTH) {
            // negative, off the screen
            continue;
        }
        // start buffer index for image column
        buffIndex = x + dxyp;
        buffByte = this.buffer[buffIndex];
        for (y = 0; y < image.height; y++) {
            var dyy = dy + y; // calc once
            if (dyy < 0 || dyy >= this.HEIGHT) {
                // negative, off the screen
                continue;
            }
            var dyyp = Math.floor(dyy / 8); // calc once

            // check if start of buffer page
            if (!(dyy % 8)) {
                // check if we need to save previous byte
                if ((x || y) && buffByte !== this.buffer[buffIndex]) {
                    // save current byte and get next buffer byte
                    this.buffer[buffIndex] = buffByte;
                    this.dirtyBytes.push(buffIndex);
                }
                // new buffer page
                buffIndex = dx + x + this.WIDTH * dyyp;
                buffByte = this.buffer[buffIndex];
            }

            // process pixel into buffer byte
            dataIndex = (image.width * y + x) << 2; // 4 bytes per pixel (RGBA)
            if (!image.data[dataIndex + 3]) {
                // transparent, continue to next pixel
                continue;
            }

            pixelByte = 0x01 << (dyy - 8 * dyyp);
            bit = image.data[dataIndex] || image.data[dataIndex + 1] || image.data[dataIndex + 2];
            if (bit) {
                buffByte |= pixelByte;
            }
            else {
                buffByte &= ~pixelByte;
            }
        }
        if ((x || y) && buffByte !== this.buffer[buffIndex]) {
            // save current byte
            this.buffer[buffIndex] = buffByte;
            this.dirtyBytes.push(buffIndex);
        }
    }

    if (immed) {
        this._updateDirtyBytes(this.dirtyBytes);
    }
}

// draw an image pixel array on the screen
SH1106.prototype.drawBitmap = function (pixels, sync) {
    let x;
    let y;

    for (let i = 0; i < pixels.length; i++) {
        x = Math.floor(i % this.WIDTH);
        y = Math.floor(i / this.WIDTH);

        this.drawPixel([x, y, pixels[i]], false);
    }

    if (sync) {
        this._updateDirtyBytes(this.dirtyBytes);
    }
}

/* ##################################################################################################
 * Private utilities
 * ##################################################################################################
 */

SH1106.prototype._initialise = function () {
    // sequence of bytes to initialise with
    var initSeq = [
        this.DISPLAY_OFF,
        this.SET_DISPLAY_CLOCK_DIV, 0x80,
        this.SET_MULTIPLEX, this.screenConfig.multiplex, // set the last value dynamically based on screen size requirement
        this.SET_DISPLAY_OFFSET, 0x00,
        this.SET_START_LINE,
        this.CHARGE_PUMP, 0x8B, // charge pump val
        this.SEG_REMAP, // screen orientation
        this.COM_SCAN_DEC, // screen orientation change to INC to flip
        this.SET_COM_PINS, this.screenConfig.compins, // com pins val sets dynamically to match each screen size requirement
        this.SET_CONTRAST, 0x80, // contrast val
        this.SET_PRECHARGE, 0x22, // precharge val
        this.SET_VCOM_DETECT, 0x35, // vcom detect
        this.NORMAL_DISPLAY,
        this.DISPLAY_ON
    ];

    // write init seq commands
    for (var i = 0; i < initSeq.length; i++) {
        this._transfer('cmd', initSeq[i]);
    }
}

// writes both commands and data buffers to this device
SH1106.prototype._transfer = function (type, val, fn) {
    var control;
    if (type === 'data') {
        control = 0x40;
    } else if (type === 'cmd') {
        control = 0x00;
    } else {
        return;
    }

    var bufferForSend;
    //For version <6.0.0
    if (typeof Buffer.from == "undefined") {
        bufferForSend = new Buffer([control, val]);
    }
    //For version >=6.0.0
    else {
        bufferForSend = Buffer.from([control, val])
    }

    // send control and actual val
    this.wire.i2cWriteSync(this.ADDRESS, 2, bufferForSend);
    if (fn) {
        fn();
    }
}

// read a byte from the oled
SH1106.prototype._readI2C = function (fn) {
    //For version <6.0.0
    if (typeof Buffer.from == "undefined") {
        this.wire.i2cRead(this.ADDRESS, 0, new Buffer([0]), function (_err, _bytesRead, data) {
            // result is single byte
            if (typeof data === "object") {
                fn(data[0]);
            }
            else {
                fn(0);
            }
        });
    }
    //For version >=6.0.0
    else {
        var data = [0];
        this.wire.i2cReadSync(this.ADDRESS, 1, Buffer.from(data));
        fn(data[0]);
    }
}

// draw an individual character to the screen
SH1106.prototype._drawChar = function (byteArray, charHeight, size, _sync) {
    // take your positions...
    var x = this.cursor_x, y = this.cursor_y;

    // loop through the byte array containing the hexes for the char
    for (var i = 0; i < byteArray.length; i += 1) {
        for (var j = 0; j < charHeight; j += 1) {
            // pull color out
            var color = byteArray[i][j],
                xpos, ypos;
            // standard font size
            if (size === 1) {
                xpos = x + i;
                ypos = y + j;
                this.drawPixel([xpos, ypos, color], false);
            } else {
                // MATH! Calculating pixel size multiplier to primitively scale the font
                xpos = x + (i * size);
                ypos = y + (j * size);
                this.fillRect(xpos, ypos, size, size, color, false);
            }
        }
    }
}

// get character bytes from the supplied font object in order to send to framebuffer
SH1106.prototype._readCharBytes = function (byteArray, charHeight) {
    var bitArr = [],
        bitCharArr = [];
    // loop through each byte supplied for a char
    for (var i = 0; i < byteArray.length; i += 1) {
        // set current byte
        var byte = byteArray[i];
        // read each byte
        for (var j = 0; j < charHeight; j += 1) {
            // shift bits right until all are read
            var bit = byte >> j & 1;
            bitArr.push(bit);
        }
        // push to array containing flattened bit sequence
        bitCharArr.push(bitArr);
        // clear bits for next byte
        bitArr = [];
    }
    return bitCharArr;
}

// find where the character exists within the font object
SH1106.prototype._findCharBuf = function (font, c) {
    // use the lookup array as a ref to find where the current char bytes start
    var cBufPos = font.lookup.indexOf(c) * font.width;
    // slice just the current char's bytes out of the fontData array and return
    var cBuf = font.fontData.slice(cBufPos, cBufPos + font.width);
    return cBuf;
}

// looks at dirty bytes, and sends the updated bytes to the display
SH1106.prototype._updateDirtyBytes = function (dirtyByteArray) {
    var dirtyByteArrayLen = dirtyByteArray.length

    // check to see if this will even save time
    if (dirtyByteArrayLen > (this.buffer.length / 7)) {
        // just call regular update at this stage, saves on bytes sent
        this.update();
        // now that all bytes are synced, reset dirty state
        this.dirtyBytes = [];
    } else {
        this._waitUntilReady(function () {
            // iterate through dirty bytes
            for (var i = 0; i < dirtyByteArrayLen; i += 1) {

                var dirtyByteIndex = dirtyByteArray[i];
                var page = Math.floor(dirtyByteIndex / this.WIDTH);
                var col = Math.floor(dirtyByteIndex % this.WIDTH);

                // Ensure that column is only 0..127.
                col &= 0x7F;
                col += this.screenConfig.coloffset; // Column Bias for a SH1106

                // Compute the lower and high column addresses
                var lowAddress = (col & 0x0F); // lower address ranges from 0 to 0x0F
                var highAddress = this.COLUMN_HIGH_START_ADDR | (col >>> 4); // high address ranges from 0x10 to 0x18
                var displaySeq = [
                    this.PAGE_ADDR + page,
                    lowAddress,
                    highAddress
                ];

                for (var v = 0; v < displaySeq.length; v += 1) {
                    this._transfer('cmd', displaySeq[v]);
                }
                this._transfer('data', this.buffer[dirtyByteIndex]);
            }
            // now that all bytes are synced, reset dirty state
            this.dirtyBytes = [];
        }.bind(this));
    }
}

// sometimes the oled gets a bit busy with lots of bytes.
// Read the response byte to see if this is the case
SH1106.prototype._waitUntilReady = function (callback) {
    var oled = this;
    function tick(callback) {
        oled._readI2C(function (byte) {
            // read the busy byte in the response
            busy = byte >> 7 & 1;
            if (!busy) {
                // if not busy, it's ready for callback
                callback();
            } else {
                setTimeout(function () { tick(callback) }, 0);
            }
        });
    };
    setTimeout(function () { tick(callback) }, 0);
}


module.exports = SH1106;
