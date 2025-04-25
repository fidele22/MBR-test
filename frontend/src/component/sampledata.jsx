import React, { useEffect, useState } from "react";
import './chart.css'
const TimeIntervalsList = () => {
  const [timeIntervals, setTimeIntervals] = useState([]);

  // Fetch all sensor data on mount
  const fetchAllIntervals = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/all-sensor-data");
      const data = await response.json();

      let intervals = [];
      for (let i = 1; i < data.length; i++) {
        if (data[i].timeTaken === 0 && data[i - 1].timeTaken > 0) {
          intervals.push(data[i - 1].timeTaken);
        }
      }

      setTimeIntervals(intervals); // Store all found intervals
    } catch (error) {
      console.error("Error fetching intervals:", error);
    }
  };

  // Fetch intervals when component mounts
  useEffect(() => {
    fetchAllIntervals();
  }, []);

  return (
    <div className="scroll-box">
      <h3>Sample test:</h3>
      <button onClick={fetchAllIntervals} className="refresh-btn">Refresh</button>
     
      <ul className="interval-list">
        {timeIntervals.length > 0 ? (
          timeIntervals.map((interval, index) => (
            <li key={index} className="interval-item">
              {interval.toFixed(2)} seconds
            </li>
          ))
        ) : (
          <p>No intervals recorded</p>
        )}
      </ul>
    </div>
  );
};

export default TimeIntervalsList;
