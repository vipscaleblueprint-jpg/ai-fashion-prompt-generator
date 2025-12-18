
const WEBHOOK_URL = "https://n8n.srv1151765.hstgr.cloud/webhook/marketing-clients";

async function testFetch() {
    console.log("Fetching from:", WEBHOOK_URL);
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            console.error("Response not OK:", response.status);
            return;
        }

        const data = await response.json();
        console.log("Data received (structure):", Array.isArray(data) ? "Array" : typeof data);
        if (Array.isArray(data) && data.length > 0) {
            console.log("First item sample:", JSON.stringify(data[0], null, 2));
        } else {
            console.log("Full data:", JSON.stringify(data, null, 2));
        }

    } catch (e) {
        console.error("Fetch failed:", e);
    }
}

testFetch();
