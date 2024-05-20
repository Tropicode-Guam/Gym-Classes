import React, { useEffect, useState } from 'react';
import {
    Button, TextField, Checkbox, FormControlLabel, Select, MenuItem,
    FormGroup, FormControl, InputLabel, Typography, Container, Box,
    CircularProgress, Snackbar, Alert
} from '@mui/material';
import ClassList from './ClassList';

const API_BASE = process.env.REACT_APP_API;

function check(headers) {
    return async (file, options = { offset: 0 }) => {
        let buffers = await readBuffer(file, 0, 8);
        buffers = new Uint8Array(buffers);
        return headers.every((header, index) => header === buffers[options.offset + index]);
    };
}

function readBuffer(file, start = 0, end = 2) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsArrayBuffer(file.slice(start, end));
    });
}

function getDOWFromDateString(ds) {
    const DAYS_OF_WEEK_MAP = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ]
    return DAYS_OF_WEEK_MAP[new Date(ds).getDay()]
}

const isPNG = check([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const isJPEG = check([0xff, 0xd8, 0xff]);
const SUPPORTED_FILE_TYPES = { 'image/png': isPNG, 'image/jpeg': isJPEG };

function Admin() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [authKey, setAuthKey] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState('');
    const [size, setSize] = useState('');
    const [image, setImage] = useState(null);
    const [imageType, setImageType] = useState(null);
    const [previewImage, setPreviewImage] = useState(null);
    const [days, setDays] = useState({
        Sunday: false,
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
    });
    const [frequency, setFrequency] = useState('none');

    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const [imageName, setImageName] = useState('');

    const dayOfWeek = getDOWFromDateString(date)

    const handleDayChange = (day) => {
        setDays((prev) => ({ ...prev, [day]: !prev[day] }));
    };

    const handleFrequencyChange = (e) => {
        setFrequency(e.target.value);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const credentials = { username, password };

        try {
            const response = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            if (response.ok) {
                const data = await response.json();
                setLoggedIn(true);
                setAuthKey(data); // Store the hash as the key
                setUsername('');
                setPassword('');
            } else {
                console.log('Login failed:', response.status);
            }
        } catch (error) {
            console.error('Request failed:', error);
        }
    };

    const handleNewClass = async (event) => {
        event.preventDefault();
        setLoading(true);

        if ([title, description, date, size, image].some(field => !field)) {
            setErrorMsg('All fields are required');
            setErrorOpen(true);
            setLoading(false);
        }

        const daysAsNumbers = getDaysAsNumbers();

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('date', date);
        formData.append('size', size);
        formData.append('image', image);
        formData.append('imageType', imageType);
        formData.append('days', JSON.stringify(daysAsNumbers));
        formData.append('frequency', frequency);
        formData.append('key', authKey); // Include the key in the request body

        try {
            const response = await fetch(`${API_BASE}/classes`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                setTitle('');
                setDescription('');
                setDate('');
                setSize('');
                setImage(null);
                setImageType(null);
                setImagePreviewUrl(null); // Reset image preview URL
                setImageName(''); // Reset image name
                setDays({
                    Sunday: false,
                    Monday: false,
                    Tuesday: false,
                    Wednesday: false,
                    Thursday: false,
                    Friday: false,
                    Saturday: false,
                });
                setFrequency('none');
                // Success notification or update state to show successful upload
            } else if (response.status === 401) {
                console.log('Login key not authorized', response.status);
                setLoggedIn(false);
            } else {
                console.log('Error posting class', response.status, response.body.text);
            }
        } catch (error) {
            console.error('Request failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = async (e) => {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0];
            let supported = false;
            let imageType = null;
            for (let stamp of Object.keys(SUPPORTED_FILE_TYPES)) {
                let fcheck = SUPPORTED_FILE_TYPES[stamp];
                if (await fcheck(file)) {
                    supported = true;
                    imageType = stamp;
                    break;
                }
            }
            if (!supported) {
                alert(`The only supported file types are ${Object.keys(SUPPORTED_FILE_TYPES).join(' ')}`);
                return;
            }
            setImage(file);
            setImageType(imageType);
            setImagePreviewUrl(URL.createObjectURL(file));
            setImageName(file.name);
        }
    };

    const getDaysAsNumbers = () => {
        const dayMapping = {
            Sunday: 0,
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
        };

        return Object.entries(days)
            .filter(([day, isSelected]) => isSelected)
            .map(([day]) => dayMapping[day]);
    };

    const fetchSignups = async () => {
        try {
            const response = await fetch(`${API_BASE}/signups`);
            if (!response.ok) {
                throw new Error('Failed to fetch signups');
            }
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'signups.csv';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error fetching signups:', error);
        }
    };

    // https://stackoverflow.com/a/57781164
    useEffect(() => {
        if (!image) {
            setPreviewImage(null);
            return
        }

        const objectUrl = URL.createObjectURL(image);
        setPreviewImage(objectUrl);

        // free memory when ever this component is unmounted
        return () => URL.revokeObjectURL(objectUrl);
    }, [image])

    return (
        <Container className="admin-page">
            {loggedIn ? (
                <>
                    <Box component="form" onSubmit={handleNewClass} noValidate sx={{ mt: 3 }}>
                        <TextField
                            label="Title"
                            fullWidth
                            margin="normal"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <TextField
                            label="Description"
                            fullWidth
                            margin="normal"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                        <TextField
                            label="Date"
                            type="datetime-local"
                            fullWidth
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                            value={date}
                            onChange={(e) => {
                                
                                setDate(e.target.value)
                                const old = getDOWFromDateString(date)
                                const dow = getDOWFromDateString(e.target.value)
                                if (old !== dow) {
                                    setDays({
                                        Sunday: false,
                                        Monday: false,
                                        Tuesday: false,
                                        Wednesday: false,
                                        Thursday: false,
                                        Friday: false,
                                        Saturday: false,
                                        [dow]: true
                                    });
                                }
                            }}
                        />
                        <TextField
                            label="Size"
                            fullWidth
                            margin="normal"
                            value={size}
                            onChange={(e) => setSize(e.target.value)}
                        />
                        <Button variant="contained" component="label" sx={{ mt: 2, mb: 2 }}>
                            Upload Image
                            <input type="file" hidden onChange={handleImageChange} />
                        </Button>
                        {imageName && (
                            <Typography variant="body2" gutterBottom>
                                Selected Image: {imageName}
                            </Typography>
                        )}
                        {imagePreviewUrl && (
                            <img src={imagePreviewUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', marginBottom: '20px' }} />
                        )}
                        <Typography variant="h6" component="h2">
                            Repeat Frequency
                        </Typography>
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="frequency-label">Frequency</InputLabel>
                            <Select
                                labelId="frequency-label"
                                value={frequency}
                                onChange={handleFrequencyChange}
                            >
                                <MenuItem value="none">None</MenuItem>
                                <MenuItem value="daily">Daily</MenuItem>
                                <MenuItem value="weekly">Weekly</MenuItem>
                                <MenuItem value="bi-weekly">Bi-Weekly</MenuItem>
                                <MenuItem value="monthly">Monthly</MenuItem>
                            </Select>
                        </FormControl>
                        {frequency === 'weekly' && (
                            <FormGroup>
                                <Typography variant="h6" component="h2">
                                    Select Days
                                </Typography>
                                {Object.keys(days).map((day) => (
                                    <FormControlLabel
                                        key={day}
                                        control={
                                            <Checkbox
                                                disabled={dayOfWeek === day}
                                                checked={days[day]}
                                                onChange={() => handleDayChange(day)}
                                            />
                                        }
                                        label={day}
                                    />
                                ))}
                            </FormGroup>
                        )}
                        <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
                            {loading ? <CircularProgress size={24} /> : 'Add Class'}
                        </Button>
                        <Snackbar 
                            open={errorOpen} 
                            autoHideDuration={3000} 
                            onClose={(event, reason) => {
                                if (reason === 'clickaway') return;
                                setErrorOpen(false)
                            }}
                        >
                            <Alert 
                                severity="error"
                                variant="filled"
                                onClose={() => setErrorOpen(false)}
                                sx={{ width: '100%' }}
                            >{errorMsg}</Alert>
                        </Snackbar>
                    </Box>
                    <ClassList />
                    <Button
                        variant="contained"
                        color="secondary"
                        sx={{ mt: 3 }}
                        onClick={fetchSignups}
                    >
                        Export Signups to CSV
                    </Button>
                </>
            ) : (
                <Container className="lock-screen">
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3 }}>
                        <TextField
                            label="Username"
                            fullWidth
                            margin="normal"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            margin="normal"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
                            Login
                        </Button>
                    </Box>
                </Container>
            )}
        </Container>
    );
}

export default Admin;
