const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 8300;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// In-memory storage for webhook requests
const webhookLogs = [];

// Basic route for the homepage (index.html)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Webhook endpoint
app.post("/webhook", (req, res) => {
    console.log("Webhook received:", req.body);

    if (Object.keys(req.body).length > 0) {
        webhookLogs.push({
            timestamp: new Date().toISOString(),
            data: req.body
        });
        res.status(200).json({ status: "success", message: "Data received" });
    } else {
        res.status(400).json({ status: "error", message: "No data received in webhook body" });
    }
});

// Endpoint to retrieve webhook logs for the frontend
app.get("/api/webhook-logs", (req, res) => {
    res.status(200).json(webhookLogs);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
