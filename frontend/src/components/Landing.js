import React, { useState, useEffect } from 'react';

import './Landing.css';
const API_BASE = process.env.REACT_APP_API

const Landing = () => {
    const [classes, setClasses] = useState([]);
    const [error, setError] = useState(null);

    const fetchClasses = async () => {
        try {
            // If your server runs on port 5000
            const response = await fetch(`${API_BASE}/classes`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setClasses(data);
        } catch (error) {
            setError(`Error fetching classes: ${error.message}`);
        }
    };
    

    // Use useEffect to fetch classes when the component mounts
    useEffect(() => {
        fetchClasses();
    }, []);

    return (
        <div className='Classes'>
            <h1>Classes</h1>
            {error && <p>Error fetching classes: {error}</p>}
            <ul>
                {classes.map((classItem) => (
                    <li key={classItem._id}>
                        <h2>{classItem.title}</h2>
                        <p>Date: {classItem.date}</p>
                        <p>Description: {classItem.description}</p>
                        {/* Add other class details you want to display */}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Landing;
