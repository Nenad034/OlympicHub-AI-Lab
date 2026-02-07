
import fs from 'fs';
import { XMLParser } from 'fast-xml-parser';

const text = fs.readFileSync('hotels_bulgaria.xml', 'utf8');
const parser = new XMLParser({ ignoreAttributes: true });
const parsed = parser.parse(text);

const body = parsed['soap:Envelope']?.['soap:Body'] || parsed['Envelope']?.['Body'];
const response = body?.GetHotelsResponse;
const result = response?.GetHotelsResult;
const hotels = result?.Hotel;

if (Array.isArray(hotels)) {
    console.log("Total hotels:", hotels.length);
    hotels.slice(0, 5).forEach(h => {
        console.log(`Hotel: ${h.Name}, ID: ${h.ID}`);
        console.log(`Description: ${h.Description}`);
    });
} else {
    console.log("No hotels found in structured way.");
}
