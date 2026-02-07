
import fs from 'fs';

const text = fs.readFileSync('hotels_bulgaria.xml', 'utf8');
console.log("Total length:", text.length);
const regex = />([^<]{100,})</g;
let match;
while ((match = regex.exec(text)) !== null) {
    console.log("Found long content:", match[1].substring(0, 200));
}
