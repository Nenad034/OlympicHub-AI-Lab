
import fs from 'fs';

const xml = fs.readFileSync('room_desc_debug.xml', 'utf8');
const tags = new Set();
const tagRegex = /<([^/ >]+)/g;
let match;
while ((match = tagRegex.exec(xml)) !== null) {
    tags.add(match[1]);
}

console.log("All unique tags in GetRoomDescriptions response:");
console.log(Array.from(tags).sort());
