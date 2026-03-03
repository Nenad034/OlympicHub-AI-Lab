const fs = require('fs');
const PNG = require('pngjs').PNG;

fs.createReadStream('public/clicktotravel.png')
    .pipe(new PNG())
    .on('parsed', function () {
        let blockW = 16;
        let blockH = 16;
        let out = "";
        for (let y = 0; y < this.height; y += blockH) {
            for (let x = 0; x < this.width; x += blockW) {
                let count = 0;
                for (let yy = 0; yy < blockH && y + yy < this.height; yy++) {
                    for (let xx = 0; xx < blockW && x + xx < this.width; xx++) {
                        let idx = (this.width * (y + yy) + (x + xx)) << 2;
                        if (this.data[idx + 3] > 10) {
                            let r = this.data[idx];
                            let g = this.data[idx + 1];
                            let b = this.data[idx + 2];
                            const distFromWhite = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
                            if (distFromWhite >= 60) count++;
                        }
                    }
                }
                out += count > 10 ? "#" : ".";
            }
            out += "\n";
        }
        console.log(out);
    });
