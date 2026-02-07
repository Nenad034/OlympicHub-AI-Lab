
import fs from 'fs';

const text = fs.readFileSync('hotels_bulgaria.xml', 'utf8');
const tagNames = new Set<string>();
const regex = /<([a-zA-Z0-9]+)/g;
let match;
while ((match = regex.exec(text)) !== null) {
    tagNames.add(match[1]);
}
console.log("Found tags:", Array.from(tagNames).sort().join(", "));
