const fs = require('fs');
const PNG = require('pngjs').PNG;

fs.createReadStream('public/clicktotravel.png')
    .pipe(new PNG())
    .on('parsed', function () {
        let minX = this.width, maxX = 0, minY = this.height, maxY = 0;
        let inEmblem = false;
        let gapCount = 0;

        for (let x = 0; x < this.width; x++) {
            let columnHasPixels = false;
            for (let y = 0; y < this.height; y++) {
                let idx = (this.width * y + x) << 2;

                // alpha
                if (this.data[idx + 3] > 10) {
                    let r = this.data[idx];
                    let g = this.data[idx + 1];
                    let b = this.data[idx + 2];
                    const distFromWhite = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
                    if (distFromWhite >= 60) {
                        columnHasPixels = true;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            if (columnHasPixels) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                inEmblem = true;
                gapCount = 0;
            } else if (inEmblem) {
                gapCount++;
                if (gapCount > 50) { // Large gap means we hit the text
                    break;
                }
            }
        }
        console.log(`Emblem Bounds: minX=${minX}, maxX=${maxX}, minY=${minY}, maxY=${maxY}`);
        console.log(`Original Size: ${this.width}x${this.height}`);
    });
