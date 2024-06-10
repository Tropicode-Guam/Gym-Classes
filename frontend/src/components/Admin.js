import React, { useEffect, useState, useContext, useRef } from 'react';
import {
    Button, TextField, Checkbox, FormControlLabel, Select, MenuItem,
    FormGroup, FormControl, InputLabel, Typography, Container, Box,
    CircularProgress, Snackbar, Alert, ButtonBase, Grid,
    InputAdornment
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import ClassList from './ClassList';
import { ClassCard } from './ClassCard';
import { OnlyOngoingContext } from '../Contexts';
import { useGetClassesQuery } from '../slices/classesSlice';
import insurances from 'settings/insurances';
const sponsors = insurances.Sponsors.map(s => s.name || s);

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
    const form = useRef(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(false);
    const [authKey, setAuthKey] = useState('');

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [sponsor, setSponsor] = useState('None')
    const [trainer, setTrainer] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [size, setSize] = useState('');
    const [fee, setFee] = useState(0);
    const [image, setImage] = useState(null);
    const [imageType, setImageType] = useState(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

    const onlyOngoing = useContext(OnlyOngoingContext);
    const { refetch: refetchClasses } = useGetClassesQuery(onlyOngoing);

    let endTimeBeforeStart = false
    let endDateTime = ''
    if (startDate && endTime) {
        let edt = new Date(startDate)
        edt.setUTCHours(...endTime.split(':'))
        endDateTime = edt.toISOString().slice(0,-1)
        endTimeBeforeStart = new Date(endDateTime) <= new Date(startDate)
        if (endTimeBeforeStart) {
            edt.setDate(edt.getDate() + 1)
            endDateTime = edt.toISOString().slice(0,-1)
        }
    }

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

    const EMPTY_DAYS = {
        Sunday: false,
        Monday: false,
        Tuesday: false,
        Wednesday: false,
        Thursday: false,
        Friday: false,
        Saturday: false,
    }

    const [days, setDays] = useState({...EMPTY_DAYS});
    const DEFAULT_DAYS_PRIOR_CAN_SIGN_UP = 2
    const [frequency, setFrequency] = useState('none');
    const [daysPriorCanSignUp, setDaysPriorCanSignUp] = useState(DEFAULT_DAYS_PRIOR_CAN_SIGN_UP);

    // Define the error state variables
    const [errorMsg, setErrorMsg] = useState('');
    const [errorOpen, setErrorOpen] = useState(false);

    const[showRequiredFields, setShowRequiredFields] = useState(false);
    const [editingClassItem, setEditingClassItem] = useState(null);

    const dayOfWeek = getDOWFromDateString(startDate)

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

    const getDaysAsMap = (dayList) => {
        const dayMap = {...EMPTY_DAYS}
        const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        dayList.forEach((day) => {
            dayMap[dayOrder[day]] = true
        })
        return dayMap
    };

    const previewClassItem = {
        title: title,
        description: description,
        sponsor: sponsor === 'None' ? '' : sponsor,
        trainer: trainer,
        startDate: startDate,
        endTime: endDateTime,
        endDate: endDate,
        frequency: frequency,
        days: getDaysAsNumbers(),
        imageUrl: imagePreviewUrl,
        imageType: imageType,
        size: size,
        color: color,
        _id: "PREVIEW"
    }

    const resetClassForm = () => {
        setTitle('');
        setDescription('');
        setSponsor('None');
        setTrainer('');
        setStartDate('');
        setEndTime('');
        setEndDate('');
        setSize('');
        setFee(0);
        setImage(null);
        setImageType(null);
        setImagePreviewUrl(null); // Reset image preview URL
        setDays({...EMPTY_DAYS});
        setFrequency('none');
        setDaysPriorCanSignUp(DEFAULT_DAYS_PRIOR_CAN_SIGN_UP);
        setColor(chooseRandomColor());
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

        if ([title, description, startDate, endTime, size, image].some(field => !field)) {
            setErrorMsg('Missing required fields');
            setShowRequiredFields(true)
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
        formData.append('sponsor', sponsor === 'None' ? '' : sponsor);
        formData.append('trainer', trainer);
        formData.append('startDate', new Date(startDate).toISOString());
        formData.append('endTime', new Date(endDateTime).toISOString());
        formData.append('endDate', endDate && new Date(endDate).toISOString());
        formData.append('size', size);
        formData.append('image', image);
        formData.append('fee', fee);
        formData.append('imageType', imageType);
        formData.append('days', JSON.stringify(daysAsNumbers));
        formData.append('frequency', frequency);
        formData.append('daysPriorCanSignUp', daysPriorCanSignUp);
        formData.append('color', color);
        formData.append('key', authKey); // Include the key in the request body

        try {
            let response;
            if (editingClassItem) {
                response = await fetch(`${API_BASE}/classes/${editingClassItem._id}`, {
                    method: 'PUT',
                    body: formData
                });
            } else {
                response = await fetch(`${API_BASE}/classes`, {
                    method: 'POST',
                    body: formData
                });
            }

            if (response.ok) {
                resetClassForm();
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
            refetchClasses()
            setShowRequiredFields(false);
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

    const handleClassSelect = (classItem) => {
        setEditingClassItem(classItem);

        setTitle(classItem.title);
        setDescription(classItem.description);
        setSponsor(classItem.sponsor);
        setTrainer(classItem.trainer);
        setStartDate(format(new Date(classItem.startDate), "yyyy-MM-dd'T'HH:mm"));
        setEndDate(classItem.endDate ? format(new Date(classItem.endDate), "yyyy-MM-dd'T'HH:mm") : '');
        setEndTime(format(new Date(classItem.endTime), 'HH:mm'));
        setSize(classItem.size);
        setFee(classItem.fee);
        setFrequency(classItem.frequency);
        setDaysPriorCanSignUp(classItem.daysPriorCanSignUp);
        setColor(classItem.color);
        setDays(getDaysAsMap(classItem.days));
        setImageType(classItem.imageType);
        setImagePreviewUrl(`${API_BASE}/images/${classItem._id}`)
        setImage('EDITING');

        form.current.scrollIntoView()
    }

    useEffect(() => {
        if (image === 'EDITING') {
            return;
        }
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
        <Container className="admin-page" sx={{ marginTop: 4 }} ref={form}>
            {loggedIn ? (
                <>
                    <Typography component="h1" variant="h4">
                        {editingClassItem ? 'Edit' : 'Create'} a Class
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
                                        required
                                        error={showRequiredFields && !title}
                                        fullWidth
                                        margin="normal"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                    <TextField
                                        label="Description"
                                        required
                                        error={showRequiredFields && !description}
                                        fullWidth
                                        multiline
                                        minRows={2}
                                        margin="normal"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                    <TextField
                                        select
                                        displayEmpty
                                        label="Sponsor"
                                        id="sponsor"
                                        name="sponsor"
                                        value={sponsor}
                                        onChange={(e) => setSponsor(e.target.value)}
                                        required
                                        fullWidth
                                        margin="normal"
                                    >
                                        <MenuItem value={'None'}>None</MenuItem>
                                        {sponsors.map((sp) => (
                                            <MenuItem key={sp} value={sp}>{sp}</MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField
                                        label="Trainer"
                                        fullWidth
                                        margin="normal"
                                        value={trainer}
                                        onChange={(e) => setTrainer(e.target.value)}
                                    >
                                    </TextField>
                                    <TextField
                                        label="Start Date and Time"
                                        required
                                        error={showRequiredFields && !startDate}
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
                                        label="End Time"
                                        type="time"
                                        inputProps={{
                                            inputMode: "24hours"
                                        }}
                                        required
                                        helperText={endTimeBeforeStart && "End time is start time or before. This will be interpreted as the class going into the next day"}
                                        error={endTimeBeforeStart || (showRequiredFields && !endTime)}
                                        fullWidth
                                        margin="normal"
                                        InputLabelProps={{ shrink: true }}
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                    />
                                    <TextField
                                        label="End Date"
                                        type="date"
                                        fullWidth
                                        margin="normal"
                                        InputLabelProps={{ shrink: true }}
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                    <TextField
                                        label="Users can sign up this many days prior to the class"
                                        type="number"
                                        inputProps={{ min: 0 }}
                                        required
                                        fullWidth
                                        helperText="* Set to 0 to allow signups for any future class"
                                        margin="normal"
                                        value={daysPriorCanSignUp}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (val < 0 || val === '') {
                                                val = 0
                                            }
                                            setDaysPriorCanSignUp(val)
                                        }}
                                    />
                                    <TextField
                                        label="Max Class Size"
                                        type="number"
                                        inputProps={{ min: 1 }}
                                        required
                                        error={showRequiredFields && !size}
                                        fullWidth
                                        margin="normal"
                                        value={size}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            if (val < 1) {
                                                val = 1
                                            }
                                            setSize(val)
                                        }}
                                    />
                                    <TextField
                                        label="Fee"
                                        type="number"
                                        inputProps={{ min: 0 }}
                                        required
                                        error={showRequiredFields && fee === ''}
                                        fullWidth
                                        margin="normal"
                                        value={fee}
                                        onChange={(e) => {
                                            let val = e.target.value
                                            if (val < 0 || val === '') {
                                                val = '0'
                                            }
                                            if (!val.includes('.')) {
                                                val = Number(val)
                                            }
                                            val = `${val}`.match(/^\d+.?\d{0,2}/g)[0]
                                            setFee(val)
                                        }}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                                        }}
                                    />
                                    <Button variant="contained" component="label" sx={{ mt: 2, mb: 2 }}>
                                        Upload Image
                                        <input key={imagePreviewUrl} type="file" hidden onChange={handleImageChange} />
                                    </Button>
                                    <Typography variant="h6" component="h2">
                                        Repeat Frequency
                                    </Typography>
                                    <FormControl required fullWidth margin="normal">
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
                                    { editingClassItem ? 
                                    <Button 
                                        variant="contained" 
                                        onClick={() => {
                                            setEditingClassItem(null); 
                                            resetClassForm()
                                        }}
                                        sx={{ mt: 3, mr: 1 }}
                                    >
                                        Cancel
                                    </Button> 
                                    : null }
                                    <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
                                        {loading ? <CircularProgress size={24} /> : (editingClassItem ? 'Save Class' : 'Add Class')}
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
                                    </ClassCard>
                                </Box>
                            </Grid>
                        </Grid>
                    </Container>
                    <Container>
                        <ClassList 
                            onClassSelect={handleClassSelect} 
                            closeOnSelect={true} 
                            authKey={authKey}
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
