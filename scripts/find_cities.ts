
import fs from 'fs';
const text = fs.readFileSync('hotels_bulgaria.xml', 'utf8');
const cityRegex = /<City>.*?<Name>(.*?)<\/Name>.*?<ID>(\d+)<\/ID>/gs;
let match;
const cities = new Map();
while ((match = cityRegex.exec(text)) !== null) {
    cities.set(match[1], match[2]);
}
console.log("Cities found:", Array.from(cities.entries()));
