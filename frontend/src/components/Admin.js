import React, { useState } from 'react';
import DayPicker from './DayPicker';

const API_BASE = process.env.REACT_APP_API


// https://medium.com/frontend-canteen/how-to-detect-file-type-using-javascript-251f67679035
function check(headers) {
    return async (file, options={
        offset: 0
    })=> {
        let buffers = await readBuffer(file, 0, 8)
        buffers = new Uint8Array(buffers)
        return headers.every((header,index)=>header === buffers[options.offset + index])
    };
}

function readBuffer(file, start=0, end=2) {
    return new Promise((resolve,reject)=>{
        const reader = new FileReader();
        reader.onload = ()=>{
            resolve(reader.result);
        }
        ;
        reader.onerror = reject;
        reader.readAsArrayBuffer(file.slice(start, end));
    }
    );
}

const isPNG = check([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const isJPEG = check([0xff, 0xd8, 0xff]);
const SUPPORTED_FILE_TYPES = {'image/png': isPNG, 'image/jpeg': isJPEG}

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
    const [imageType, setImageType] = useState(null)

    // Added state for RepeatSchedulePicker
    const [selectedDays, setSelectedDays] = useState({
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
        Sunday: false,
    });
    const [recurring, setRecurring] = useState('none');

    // Handlers for RepeatSchedulePicker
    const handleDayChange = (day) => {
        setSelectedDays(prev => ({ ...prev, [day]: !prev[day] }));
    };

    console.log('here')
    const handleFrequencyChange = (e) => {
        setRecurring(e.target.value);
    };

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

        const formData = new FormData();
        formData.append('key', key)
        formData.append('title', title);
        formData.append('description', description);
        formData.append('date', date);
        formData.append('size', size);
        formData.append('image', image); // Add image file to the form data
        formData.append('imageType', imageType)

        try {
            // Send a POST request with form data
            const response = await fetch(`${API_BASE}/classes`, {
                method: 'POST',
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
    const handleImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0]
            let supported = false
            let imageType = null
            for (let stamp of Object.keys(SUPPORTED_FILE_TYPES)) {
                let fcheck = SUPPORTED_FILE_TYPES[stamp]
                if (await fcheck(file)) {
                    supported = true
                    imageType = stamp
                    break
                }
            }
            if (!supported) {
                alert(`The only supported file types are ${Object.keys(SUPPORTED_FILE_TYPES).join(' ')}`)
                return
            }
            setImage(file);
            setImageType(imageType);
        }
    }


    // TODO put these in their own components
    if (loggedIn) {
        return (
            <div className="admin-page">
                <h1>Create a new class</h1>
                <form onSubmit={handleNewClass}>

                    <div>
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
                    <div>
                        <h2>Select Days</h2>
                        {Object.keys(selectedDays).map((day) => (
                            <div key={day}>
                            <input
                                type="checkbox"
                                id={day}
                                checked={selectedDays[day]}
                                onChange={() => handleDayChange(day)}
                            />
                            <label htmlFor={day}>{day}</label>
                            </div>
                        ))}

                        <h2>Repeat Frequency</h2>
                        <div>
                        <select value={repeatFrequency} onChange={handleFrequencyChange}>
                            <option value="none">Weekly</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                            {/* Add other frequencies as needed */}
                        </select>
                        </div>
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
