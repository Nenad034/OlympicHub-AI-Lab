
const url = 'https://fzupyhunlucpjaaxksoi.supabase.co/rest/v1/properties?select=address,name&limit=5';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6dXB5aHVubHVjcGphYXhrc29pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1MzQzOTgsImV4cCI6MjA4NTExMDM5OH0.CSTcR9K7wbDQKkkCZiqUVETTOZdH9Np01F5WbHZPBXw';

async function test() {
    try {
        const res = await fetch(url, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`
            }
        });
        const data = await res.json();
        console.log('Sample properties:', JSON.stringify(data, null, 2));
    } catch (e) {
        console.error('Error:', e);
    }
}

test();
