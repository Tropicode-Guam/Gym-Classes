import React, { useEffect, useState } from 'react';
import {
    Button, TextField, Checkbox, FormControlLabel, Select, MenuItem,
    FormGroup, FormControl, InputLabel, Typography, Container, Box,
    CircularProgress, Snackbar, Alert, ButtonBase, Grid
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useTheme } from '@mui/material/styles';
import ClassList from './ClassList';
import { ClassCard, ClassCardAction } from './ClassCard';

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
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [size, setSize] = useState('');
    const [image, setImage] = useState(null);
    const [imageType, setImageType] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    const [color, setColor] = useState('');
    const theme = useTheme();

    const COLOR_PALETTE = []
    Object.entries(theme.palette).forEach(([key, value]) => {
        // assuming our palette is just numbers
        if (key.match(/^\d+$/)) {
            COLOR_PALETTE.push(key)
        }
    });

    const chooseRandomColor = () => {
        return `${Math.floor(Math.random() * COLOR_PALETTE.length)}`;
    }

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

    // Define the error state variables
    const [errorMsg, setErrorMsg] = useState('');
    const [errorOpen, setErrorOpen] = useState(false);

    const [renderKey, setRenderKey] = useState(0);

    const dayOfWeek = getDOWFromDateString(startDate)

    const previewClassItem = {
        title: title,
        description: description,
        startDate: startDate,
        endDate: endDate,
        frequency: frequency,
        days: days,
        imageUrl: imagePreviewUrl,
        imageType: imageType,
        size: size,
        color: color,
        _id: "PREVIEW"
    }

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

        if ([title, description, startDate, size, image].some(field => !field)) {
            setErrorMsg('All fields are required');
            setErrorOpen(true);
            setLoading(false);
            return; // Add return to prevent further execution
        }

        if (endDate && new Date(startDate) > new Date(endDate)) {
            setErrorMsg('Start date must be before end date');
            setErrorOpen(true);
            return; // Add return to prevent further execution
        }

        const daysAsNumbers = getDaysAsNumbers();

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('startDate', startDate);
        formData.append('endDate', endDate);
        formData.append('size', size);
        formData.append('image', image);
        formData.append('imageType', imageType);
        formData.append('days', JSON.stringify(daysAsNumbers));
        formData.append('frequency', frequency);
        formData.append('color', color);
        formData.append('key', authKey); // Include the key in the request body

        try {
            const response = await fetch(`${API_BASE}/classes`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                setTitle('');
                setDescription('');
                setStartDate('');
                setEndDate('');
                setSize('');
                setImage(null);
                setImageType(null);
                setImagePreviewUrl(null); // Reset image preview URL
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
                setColor(chooseRandomColor());
                // Success notification or update state to show successful upload
            } else if (response.status === 401) {
                console.log('Login key not authorized', response.status);
                setLoggedIn(false);
            } else {
                // Error notification
                try {
                    const responseJson = await response.json();
                    console.log('Error posting class', response.status, responseJson.error);
                    setErrorMsg(responseJson.error);
                    setErrorOpen(true);
                } catch (error) {
                    const responseText = await response.text();
                    console.log('Error posting class', response.status, responseText);
                    setErrorMsg(responseText);
                    setErrorOpen(true);
                }
            }
        } catch (error) {
            console.error('Request failed:', error);
        } finally {
            setLoading(false);
            setRenderKey(renderKey + 1);
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

    useEffect(() => {
        if (!image) {
            setImagePreviewUrl(null);
            return;
        }

        const objectUrl = URL.createObjectURL(image);
        setImagePreviewUrl(objectUrl);

        // Free memory when this component is unmounted
        return () => URL.revokeObjectURL(objectUrl);
    }, [image]);

    useEffect(() => {
        setColor(chooseRandomColor());
        // chooseRandomColor doesn't need to be a dependency
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <Container className="admin-page" sx={{ marginTop: 4 }}>
            {loggedIn ? (
                <>
                    <Typography component="h1" variant="h4">
                        Create a Class
                    </Typography>
                    <Container>
                        <Grid
                            container
                            spacing={4}
                            alignItems="center"
                            justifyContent="space-evenly"
                        >
                            <Grid item xs={12} sm={6} md={6}>
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
                                        multiline
                                        minRows={2}
                                        margin="normal"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                    <TextField
                                        label="Start Date"
                                        type="datetime-local"
                                        fullWidth
                                        margin="normal"
                                        InputLabelProps={{ shrink: true }}
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            const old = getDOWFromDateString(startDate);
                                            const dow = getDOWFromDateString(e.target.value);
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
                                        label="End Date"
                                        type="datetime-local"
                                        fullWidth
                                        margin="normal"
                                        InputLabelProps={{ shrink: true }}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                    <TextField
                                        label="Max Class Size"
                                        fullWidth
                                        margin="normal"
                                        value={size}
                                        onChange={(e) => setSize(e.target.value)}
                                    />
                                    <Button variant="contained" component="label" sx={{ mt: 2, mb: 2 }}>
                                        Upload Image
                                        <input type="file" hidden onChange={handleImageChange} />
                                    </Button>
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
                                            <MenuItem value="none">Single Day Class</MenuItem>
                                            <MenuItem value="daily">Daily</MenuItem>
                                            <MenuItem value="weekly">Weekly</MenuItem>
                                            <MenuItem value="bi-weekly">Every Other Week</MenuItem>
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
                                    <Box>
                                        {/* color preview */}
                                        <Typography
                                            variant="h6"
                                            component="h2"
                                            sx={{ my: 3 }}
                                        >Color</Typography>
                                        <Box>
                                            {COLOR_PALETTE.map((c, index) =>
                                                <ButtonBase
                                                    variant="contained"
                                                    color='1'
                                                    key={index}
                                                    sx={{
                                                        backgroundColor: `${index}.main`,
                                                        width: 48,
                                                        height: 48,
                                                        border: color === `${index}` ? 2 : 0,
                                                        borderColor: color === `${index}` ? `${index}.contrastText` : null
                                                    }}
                                                    onClick={() => setColor(`${index}`)}
                                                >
                                                    {color === `${index}` ? <CheckIcon sx={{ color: `${index}.contrastText` }} /> : null}
                                                </ButtonBase>
                                            )}
                                        </Box>
                                    </Box>
                                    <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
                                        {loading ? <CircularProgress size={24} /> : 'Add Class'}
                                    </Button>
                                    <Snackbar
                                        open={errorOpen}
                                        autoHideDuration={3000}
                                        onClose={(event, reason) => {
                                            if (reason === 'clickaway') return;
                                            setErrorOpen(false);
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
                            </Grid>
                            <Grid item xs={12} sm={6} md={4}
                                sx={{ position: 'sticky', top: '50%', transform: 'translateY(-50%)' }}
                            >
                                <Box>
                                    <ClassCard classItem={previewClassItem} key={imagePreviewUrl}>
                                        <ClassCardAction>
                                            <Button variant="contained" sx={{
                                                borderBottomLeftRadius: 100,
                                            }}>Sign Up</Button>
                                        </ClassCardAction>
                                    </ClassCard>
                                </Box>
                            </Grid>
                        </Grid>
                    </Container>
                    <Container>
                        <ClassList
                            // rerenders the whole component
                            // but lazy to pull state up to this level
                            key={renderKey}
                        />
                    </Container>
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
