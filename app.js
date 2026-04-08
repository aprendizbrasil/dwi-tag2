const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs"); // Required for file system operations

const app = express();
const PORT = 8300;
const LOG_FILE = "log.txt"; // Log file path

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
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

        // Append to log.txt file
        fs.appendFile(LOG_FILE, JSON.stringify(logEntryFile) + "\n", (err) => {
            if (err) {
                console.error("Error writing to log.txt:", err);
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

// Route to download log.txt
app.get("/download-log", (req, res) => {
    const logFilePath = path.join(__dirname, LOG_FILE);
    res.download(logFilePath, (err) => {
        if (err) {
            console.error("Error downloading log file:", err);
            res.status(500).send("Error downloading log file.");
        }
    });
});

// Route to view log.txt content
app.get("/view-log", (req, res) => {
    const logFilePath = path.join(__dirname, LOG_FILE);
    fs.readFile(logFilePath, "utf8", (err, data) => {
        if (err) {
            console.error("Error reading log file:", err);
            res.status(500).send("Error reading log file.");
        } else {
            res.status(200).set("Content-Type", "text/plain").send(data);
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
