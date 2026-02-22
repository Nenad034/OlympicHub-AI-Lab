
async function testFetch() {
    try {
        const response = await fetch('https://b2b.solvex.bg/en/api/?limit=5');
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
testFetch();
