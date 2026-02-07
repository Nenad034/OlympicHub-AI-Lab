
import fs from 'fs';

const text = fs.readFileSync('room_desc_debug.xml', 'utf8');
const regex = />([^<]{50,})</g;
let match;
while ((match = regex.exec(text)) !== null) {
    console.log("Found long content:", match[1].substring(0, 100));
}
