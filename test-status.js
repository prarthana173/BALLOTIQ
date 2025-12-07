const http = require('http');

function testStatus() {
    http.get('http://127.0.0.1:3000/vote-status/12345', (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log("Status Code:", res.statusCode);
            console.log("Response:", data);
        });
    }).on('error', (err) => {
        console.error("Error:", err.message);
    });
}

testStatus();
