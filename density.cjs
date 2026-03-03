const fs = require('fs');
const PNG = require('pngjs').PNG;

fs.createReadStream('public/clicktotravel.png')
    .pipe(new PNG())
    .on('parsed', function () {
        let cols = Array(this.width).fill(0);
        for (let x = 0; x < this.width; x++) {
            let count = 0;
            for (let y = 0; y < this.height; y++) {
                let idx = (this.width * y + x) << 2;
                if (this.data[idx + 3] > 10) {
                    let r = this.data[idx];
                    let g = this.data[idx + 1];
                    let b = this.data[idx + 2];
                    const distFromWhite = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
                    if (distFromWhite >= 60) count++;
                }
            }
            cols[x] = count;
        }

        let output = "";
        for (let i = 0; i < cols.length; i += 10) {
            let sum = 0;
            for (let j = 0; j < 10 && i + j < cols.length; j++) sum += cols[i + j];
            output += (sum > 50 ? "#" : ".");
        }
        console.log(output);
    });
