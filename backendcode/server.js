const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

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


// API endpoint to fetch all sensor data
app.get("/api/sensor-data", async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: -1 }).limit(10); // Get last 20 entries
    res.json(data.reverse()); // Reverse to show oldest first
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/api/all-sensor-data", async (req, res) => {
  try {
    const data = await SensorData.find().sort({ timestamp: 1 }); // Get all data in chronological order
    res.json(data);
  } catch (error) {
    console.error("Error fetching all data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
