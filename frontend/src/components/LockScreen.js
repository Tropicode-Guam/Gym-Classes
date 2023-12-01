import React, { useState } from 'react';

const API_BASE = process.env.REACT_APP_API

function LockScreen() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

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

export default LockScreen;
