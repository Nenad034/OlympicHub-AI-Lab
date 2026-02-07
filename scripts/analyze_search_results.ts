
import fs from 'fs';

const data = JSON.parse(fs.readFileSync('search_rich_debug.json', 'utf8'));
const dr = data.Data?.DataRequestResult;
const colNames = dr?.ColunmNames?.string || [];
const items = dr?.ResultTable?.diffgram?.DocumentElement?.HotelServices || [];

if (Array.isArray(items)) {
    items.forEach((s, idx) => {
        console.log(`--- Result ${idx} ---`);
        console.log(`Hotel: ${s.HotelName} (ID: ${s.HotelKey})`);
        console.log(`Image: ${s.HotelImage}`);
        console.log(`WebSite: ${s.HotelWebSite}`);
        console.log(`Description Snippet: ${String(s.Description).substring(0, 100)}...`);
    });
} else if (items) {
    // Single item
    console.log(`Hotel: ${items.HotelName} (ID: ${items.HotelKey})`);
    console.log(`Image: ${items.HotelImage}`);
    console.log(`WebSite: ${items.HotelWebSite}`);
} else {
    console.log("No items found in diffgram.");
}
