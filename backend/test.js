const fetch = require('node-fetch');

async function test() {
    try {
        const res = await fetch('https://crop-wizard.vercel.app/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username: 'test', password: 'test' }),
            headers: { 'Content-Type': 'application/json' }
        });
        const text = await res.text();
        console.log(`STATUS: ${res.status}`);
        console.log(`BODY: ${text}`);
    } catch (err) {
        console.error("Fetch failed", err);
    }
}
test();
