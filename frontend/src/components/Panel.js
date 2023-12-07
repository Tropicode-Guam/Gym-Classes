import React, { useState } from 'react';

function Panel() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [size, setSize] = useState('');
    const [imageURL, setImageURL] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Construct the class data
        const classData = {
            title,
            description,
            date: new Date(date), // Ensure the date is in the right format
            size: Number(size),   // Convert size to a number
            imageURL
        };

        try {
            // Send a POST request to the server
            const response = await fetch('/api/classes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(classData),
            });

            if (response.ok) {
                console.log('Class created successfully');
                // Handle success - clear the form or show a success message
            } else {
                console.log('Failed to create class', response.status);
                // Handle errors - show an error message
            }
        } catch (error) {
            console.error('Request failed', error);
            // Handle network errors
        }
    };

    return (
        <div>
            <h1>Create New Class</h1>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Title:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                </div>
                <div>
                    <label>Description:</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <div>
                    <label>Date:</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                    />
                </div>
                <div>
                    <label>Size:</label>
                    <input
                        type="number"
                        value={size}
                        onChange={(e) => setSize(e.target.value)}
                    />
                </div>
                <div>
                    <label>Image URL:</label>
                    <input
                        type="text"
                        value={imageURL}
                        onChange={(e) => setImageURL(e.target.value)}
                    />
                </div>
                <button type="submit">Create Class</button>
            </form>
        </div>
    );
}

export default Panel;
