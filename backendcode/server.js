const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");

const app = express();
const PORT = 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/sensorDataDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.error("MongoDB connection error:", err));

// Define Mongoose schema and model
const sensorDataSchema = new mongoose.Schema({
  color: String,
  RGB: {
    red: Number,
    green: Number,
    blue: Number
  },
  timeTaken: Number,
  lightIntensity: Number,  // Added field
  timestamp: { type: Date, default: Date.now }
});

const SensorData = mongoose.model("SensorData", sensorDataSchema);
//API
app.post("/api/send-sensor-data", async (req, res) => {
  console.log("Received Data:", req.body); // Log received data
  try {
      const { color, RGB, timeTaken, opt101Value } = req.body;

      if (!color || !RGB || RGB.red === undefined || RGB.green === undefined || RGB.blue === undefined || timeTaken === undefined || opt101Value === undefined) {
          return res.status(400).json({ message: "Invalid data format", received: req.body });
      }

      const newSensorData = new SensorData({ color, RGB, timeTaken, lightIntensity: opt101Value });
      await newSensorData.save();

      res.status(201).json({ message: "Data saved successfully" });
  } catch (error) {
      console.error("Error saving data:", error);
      res.status(500).json({ message: "Server error" });
  }
});


// API endpoint to fetch all sensor data and used to display it on frontend charts
app.get("/api/sensor-data", async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(10); // Get last 20 entries
    res.json(data.reverse()); // Reverse to show oldest first
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

//router used to fetch and display the stoping time taken 
app.get("/api/all-sensor-data", async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: 1 }); // Get all data in chronological order
    res.json(data);
  } catch (error) {
    console.error("Error fetching all data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Endpoint to fetch latest sensor data and used in ML prediction 
app.get("/api/predict_data", async (req, res) => {
  try {
    const latest = await SensorData.findOne().sort({ timestamp: -1 });

    if (!latest) return res.status(404).json({ message: "No data found" });

    // Spawn Python process
  // Full path to the predict.py file
const scriptPath = path.join(__dirname, "..", "pythonML", "predict_milk_quality.py");

const python = spawn("python3", [scriptPath]);
    let result = "";

    // Send data to Python
    python.stdin.write(JSON.stringify(latest));
    python.stdin.end();

    python.stdout.on("data", (data) => {
      console.log("Raw output from Python:", data.toString());  // <-- Add this
      result += data.toString();
    });

    python.stderr.on("data", (data) => {
      console.error("Python error:", data.toString());
    });

    python.on("close", (code) => {
      if (code !== 0) return res.status(500).json({ error: "Prediction failed" });
      const prediction = JSON.parse(result);
      res.json({
        input: latest,
        prediction
      });
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
