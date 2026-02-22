
import fs from 'fs';

const text = fs.readFileSync('room_desc_debug.xml', 'utf8');
const urls = text.match(/https?:\/\/[^\s\"\'<>]+/gi);
if (urls) {
    const unique = [...new Set(urls)];
    console.log("Found unique URLs:", unique);
} else {
    console.log("No URLs found.");
}
