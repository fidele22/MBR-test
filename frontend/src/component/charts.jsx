import React, { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import TimeIntervalsList from "./sampledata";  
import './chart.css'
const SensorGraphs = () => {
  const [sensorData, setSensorData] = useState([]);
  const [timeTaken, setTimeTaken] = useState(0); 
  const [timeIntervals, setTimeIntervals] = useState([]);
  const [prediction, setPrediction] = useState(null);


  const fetchSensorData = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/sensor-data");
      const data = await response.json();

      if (data.length > 0) {
        setTimeTaken(data[data.length - 1].timeTaken); // Use the last entry
      }
  
      console.log("Fetched Sensor Data:", data);
     // Find instances where `timeTaken` resets from nonzero to 0
    let newIntervals = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i].timeTaken === 0 && data[i - 1].timeTaken > 0) {
        newIntervals.push(data[i - 1].timeTaken);
      }
    }

    // Append new intervals to the existing list and remove duplicates
    setTimeIntervals(prevIntervals => {
      const updatedIntervals = [...prevIntervals, ...newIntervals];

      // Ensure unique intervals (optional, remove if duplicates are allowed)
      return Array.from(new Set(updatedIntervals));
    });

    setSensorData(
      data.map(entry => ({
        ...entry,
        timestamp: new Date(entry.timestamp).toLocaleTimeString(),
      }))
    );

  
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // useEffect(() => {
  //   fetchSensorData(); // Fetch initially
  //   fetchPrediction(); 
  //   const interval = setInterval(fetchSensorData, 1000); // Refresh every 2 seconds

  //   return () => clearInterval(interval); // Cleanup on unmount
  // }, []);
  useEffect(() => {
    fetchSensorData();
    fetchPrediction(); // ← fetch the prediction too
    const interval = setInterval(() => {
      fetchSensorData();
      fetchPrediction();  // update prediction periodically
    }, 2000);
  
    return () => clearInterval(interval);
  }, []);
  
  // fetch result of prediction
  const fetchPrediction = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/predict_data");
      const data = await response.json();
      console.log("Prediction:", data);
      setPrediction(data.prediction);
    } catch (error) {
      console.error("Error fetching prediction:", error);
    }
  };
  
  return (
    <div className="sensor-page">
    {/* Navigation Bar */}
    <nav className="navbar">
      <div className="navbar-title">MBR Test</div>
    </nav>

    <div className="content">
      {/* Time Display Section */}
      <div className="info-box">
        <div className="time">
          <h3>Time Taken: {timeTaken.toFixed(2)} seconds</h3>
        </div>
        <div className="data-sample">
          <TimeIntervalsList />
        </div>
        {prediction && (
  <div className="prediction-box">
    <h3>ML Prediction Result:</h3>
    Milk Quality is:<p style={{ color: prediction.label === "Good" ? "green" : "red" }}>
    {prediction.label}
    </p>
  </div>
)}





      </div>

      {/* Grid Container for Charts */}
      <div className="chart-grid">
        <div className="chart-card">
          <h2>Color Sensor Data (RGB)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={sensorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="RGB.red" stroke="red" />
              <Line type="monotone" dataKey="RGB.green" stroke="green" />
              <Line type="monotone" dataKey="RGB.blue" stroke="blue" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Photodiode Sensor (Light Intensity)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={sensorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="lightIntensity" stroke="orange" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h2>Combined Sensor Data</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={sensorData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="RGB.red" stroke="red" />
              <Line type="monotone" dataKey="RGB.green" stroke="green" />
              <Line type="monotone" dataKey="RGB.blue" stroke="blue" />
              <Line type="monotone" dataKey="lightIntensity" stroke="orange" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
  );
};

export default SensorGraphs;