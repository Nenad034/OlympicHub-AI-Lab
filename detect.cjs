const fs = require('fs');
const PNG = require('pngjs').PNG;

fs.createReadStream('public/clicktotravel.png')
    .pipe(new PNG())
    .on('parsed', function () {
        let cols = Array(this.width).fill(0);
        let minY = this.height, maxY = 0;
        for (let x = 0; x < this.width; x++) {
            let count = 0;
            for (let y = 0; y < this.height; y++) {
                let idx = (this.width * y + x) << 2;
                if (this.data[idx + 3] > 10) {
                    let r = this.data[idx];
                    let g = this.data[idx + 1];
                    let b = this.data[idx + 2];
                    const distFromWhite = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
                    if (distFromWhite >= 60) {
                        count++;
                        if (x < 380) { // only checking the shield area for Y bounds
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }
            }
            cols[x] = count;
        }

        let minX = this.width, maxX = 0;
        let inShield = false;

        for (let x = 0; x < this.width; x++) {
            if (cols[x] > 5) { // noise threshold
                if (!inShield) {
                    minX = x;
                    inShield = true;
                }
            } else if (inShield) {
                // gap found
                if (x - minX > 50) { // genuine block
                    maxX = x;
                    break;
                }
            }
        }

        console.log(`minX=${minX}, maxX=${maxX}, minY=${minY}, maxY=${maxY}`);
        console.log(`width=${maxX - minX}, height=${maxY - minY}`);
    });
