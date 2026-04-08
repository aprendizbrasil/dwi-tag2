const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs"); // Required for file system operations

const app = express();
const PORT = 8300;
const MAX_MEMORY_LOGS = 20; // Limit for in-memory webhook requests

const LOGS_DIR = path.join(__dirname, 'log'); // Directory for daily logs

// Ensure logs directory exists
if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR);
}

// Helper function to get the current day\'s log file path (UTC)
function getDailyLogFilePath() {
    const date = new Date().toISOString().substring(0, 10); // YYYY-MM-DD in UTC
    return path.join(LOGS_DIR, `${date}.log`);
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the \'public\' directory
app.use(express.static(path.join(__dirname, "public")));

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
        const timestamp = new Date().toISOString();
        const time = `${timestamp} UTC 0 (GW)`;
        const logEntry = { timestamp, data: req.body };
        const logEntryFile = { time, data: req.body };

        // Append to in-memory logs
        webhookLogs.push(logEntry);
        // Enforce memory limit
        if (webhookLogs.length > MAX_MEMORY_LOGS) {
            webhookLogs.shift(); // Remove the oldest entry
        }

        // Append to current day\'s log file
        fs.appendFile(getDailyLogFilePath(), JSON.stringify(logEntryFile) + "\n", (err) => {
            if (err) {
                console.error("Error writing to log file:", err);
            }
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

// Route to download current day\'s log file
app.get("/download-log", (req, res) => {
    const logFilePath = getDailyLogFilePath();
    res.download(logFilePath, (err) => {
        if (err) {
            console.error("Error downloading log file:", err);
            res.status(500).send("Error downloading log file.");
        }
    });
});

// Route to view current day\'s log file content
app.get("/view-log", (req, res) => {
    const logFilePath = getDailyLogFilePath();
    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading log file:", err);
            res.status(500).send("Error reading log file.");
        } else {
            res.status(200).set("Content-Type", "text/plain").send(data);
        }
    });
});

// Route to clear in-memory webhook logs
app.post("/clear-memory-logs", (req, res) => {
    webhookLogs.length = 0; // Clear the in-memory array
    res.status(200).json({ status: "success", message: "In-memory logs cleared." });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
