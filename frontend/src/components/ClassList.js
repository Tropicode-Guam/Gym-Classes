
import React, { useState, useEffect } from 'react';

import axios from 'axios'; // Assuming you're using Axios for HTTP requests

const API_BASE = process.env.REACT_APP_API

function ClassList() {
    const [classes, setClasses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);


    // Define the function to fetch classes
    const getClasses = async () => {
        try {
            // Send a GET request to the /classes route
            const response = await axios.get(`${API_BASE}/classes`);

            // Check if the request was successful
            if (response.status === 200) {
                // Return the classes data
                return response.data;
            } else {
                // Handle errors (e.g., show error message)
                console.error('Error fetching classes:', response.status);
                return []; // Return an empty array in case of error
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            return []; // Return an empty array in case of error
        }
    };


    const handleViewUsers = async (classId) => {

        setSelectedClass(classes.find((classItem) => classItem._id === classId));

        setShowModal(true);

        console.log("classid from classlist handleviewusers", classId)

        try {
            // Send a GET request to fetch users for the specified class
            const response = await fetch(`${API_BASE}/classes/${classId}/users`);
            if (!response.ok) {
                throw new Error('Failed to fetch users for class');
            }
            setUsers(await response.json())

        } catch (error) {
            console.error('Error fetching users for class:', error);
        }
    };



    useEffect(() => {
        const fetchData = async () => {
            try {
                const classesData = await getClasses(); // Call your API function to fetch classes
                setClasses(classesData);
            } catch (error) {
                console.error('Error fetching classes:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <div>
            <h2>Class List</h2>
            <ul>
                {classes.map((classItem) => (

                    <li key={classItem._id}>
                        <h3>{classItem.title}</h3>
                        <p>Description: {classItem.description}</p>
                        {/* Add a button to view users signed up for this class */}
                        <button onClick={
                            ((classItem) => {
                                return () => { handleViewUsers(classItem._id) }
                            })(classItem)
                        }>View Users</button>
                    </li>
                ))}
            </ul>

            {/* Modal */}
            {showModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowModal(false)}>&times;</span>
                        <h2>Users for {selectedClass && selectedClass.title}</h2>
                        <ul>
                            {users.map((user) => (
                                <li key={user._id}>
                                    <p>Name: {user.name}</p>
                                    <p>Phone: {user.phone}</p>
                                    <p>Insurance: {user.insurance}</p>
                                    <p>Selected Date: {user.selectedDate}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ClassList;
