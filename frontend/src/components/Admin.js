import React, { useState } from 'react';

const API_BASE = process.env.REACT_APP_API

function Admin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loggedIn, setLoggedIn] = useState('');
    const [key, setKey] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [size, setSize] = useState('');
    // New state for image file
    const [image, setImage] = useState(null);

    const handleSubmit = async (event) => {
        event.preventDefault();

        // Prepare data to be sent in the request
        const credentials = { username, password };

        try {
            // Send a POST request to the /login endpoint
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(credentials),
            });

            // Check if the request was successful
            if (response.ok) {
                const data = await response.json();
                console.log('Login successful:', data);
                setLoggedIn(true)
                setKey(data)
                setUsername('')
                setPassword('')
                // Handle login success (e.g., redirect to another page)
            } else {
                console.log('Login failed:', response.status);
                // Handle errors (e.g., show error message)
            }
        } catch (error) {
            console.error('Request failed:', error);
            // Handle network errors (e.g., show error message)
        }
    };

    const handleNewClass = async (event) => {
        event.preventDefault();

        document.getElementById("key").value = key
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('date', date);
        formData.append('size', size);
        formData.append('image', image); // Add image file to the form data

        try {
            // Send a POST request with form data
            const response = await fetch(`${API_BASE}/classes`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${key}` // Add your auth token here
                    // 'Content-Type': 'application/json', // Do not set content type when sending form data
                },
                body: formData,
            });

            // Check if the request was successful
            if (response.ok) {
                const data = await response.json();
                console.log(data);

                setTitle('')
                setDescription('')
                // Handle login success (e.g., redirect to another page)
            } else if (response.status === 401) {
                console.log('Login key not authorized', response.status);
                setLoggedIn(false)
                // Handle errors (e.g., show error message)
            } else {
                console.log('Error posting class', response.status, response.body.text);
            }
        } catch (error) {
            console.error('Request failed:', error);
            // Handle network errors (e.g., show error message)
        }
    }

    // Function to handle image file change
    const handleImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setImage(e.target.files[0]);
        }
    }


    // TODO put these in their own components
    if (loggedIn) {
        return (
            <div className="admin-page">
                <h1>Create a new class</h1>
                <form onSubmit={handleNewClass}>

                    <div>
                        <input
                            type="hidden"
                            id="key"
                        ></input>
                        <label htmlFor="title">Title</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="description">Description</label>
                        <input
                            type="text"
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="date">Date</label>
                        <input
                            type="datetime-local"
                            id="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="size">Size</label>
                        <input
                            type="text"
                            id="size"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="image">Image:</label>
                        <input
                            type="file"
                            id="image"
                            onChange={handleImageChange}
                        />
                    </div>

                    <button type="submit">Add Class</button>
                </form>
            </div>
        )
    } else {
        return (
            <div className="lock-screen">
                <h1>Hilton Gym Panel</h1>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label htmlFor="username">Username:</label>
                        <input
                            type="text"
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password">Password:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                    <button type="submit">Login</button>
                </form>
            </div>
        );
    }
}

export default Admin;
