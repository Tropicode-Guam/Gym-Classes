import React, { useState, useEffect } from 'react';
import { Button, Modal, Box, Typography, TextField, Container, Grid, CircularProgress, Snackbar, Alert, MenuItem, IconButton } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { tzAgnosticDate } from '../utils';
import { ClassCard } from './ClassCard';
import insurances from 'settings/insurances';
import general from 'settings/general';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const API_BASE = process.env.REACT_APP_API;

const Landing = () => {
    const [classes, setClasses] = useState([]);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [selectedClassItem, setSelectedClassItem] = useState(null);
    const emptyFormData = {
        name: '',
        phone: '',
        insurance: '',
        selectedDate: '',
        selectedClass: ''
    }
    const [formData, setFormData] = useState({...emptyFormData});
    const [loading, setLoading] = useState(true);
    const [numParticipants, setNumParticipants] = useState(0);

    const [snackbarState, setSnackbarState] = useState({
        open: false,
        message: '',
        severity: 'success'
    })

    const theme = useTheme();
    const xs = useMediaQuery(theme.breakpoints.up('md'));

    const resetFormData = () => {
        setFormData({...emptyFormData})
    }

    const classFull = numParticipants >= ((selectedClassItem && selectedClassItem.size) || 0);

    const enqueueSnackbar = function (msg, { variant = 'success' }) {
        setSnackbarState({
            open: true,
            message: msg,
            severity: variant
        })
    }

    const handleOpen = (classItem) => {
        setSelectedClassItem(classItem);
        setNumParticipants(0);
        setFormData({
            ...formData,
            selectedClass: classItem._id,
            selectedDate: ''
        });
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedClassItem(null);
        resetFormData()
    };

    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        bgcolor: 'background.paper',
        border: '2px solid #000',
        boxShadow: 24,
        p: 4,
    };

    const fetchClasses = async () => {
        try {
            const response = await fetch(`${API_BASE}/classes`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const classData = await response.json();

            classData.forEach(classItem => {
                classItem.startDate = tzAgnosticDate(classItem.startDate).toISOString();
                classItem.endDate = classItem.endDate && tzAgnosticDate(classItem.endDate).toISOString();
            });
            setClasses(classData);
        } catch (error) {
            setError(`Error fetching classes: ${error.message}`);
        }
    };

    const fetchUserCount = async (classItem, date) => {
        date = format(date, 'yyyy-MM-dd');
        const userResponse = await fetch(`${API_BASE}/classes/${classItem._id}/users/date/${date}`);
        const users = await userResponse.json();
        setNumParticipants(users.length);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            if (selectedClassItem.currentUsers >= selectedClassItem.size) {
                enqueueSnackbar('Class is full!', { variant: 'error' });
                return;
            }

            if (!formData.selectedDate) {
                enqueueSnackbar('Please select a date', { variant: 'error' });
                return;
            }

            const response = await fetch(`${API_BASE}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...formData,
                    selectedDate: format(formData.selectedDate, 'yyyy-MM-dd')
                })
            });

            if (!response.ok) {
                throw new Error('Failed to sign up');
            }

            handleClose();
            enqueueSnackbar('Signed up successfully!', { variant: 'success' });

        } catch (error) {
            console.error('Error signing up:', error.message);
            enqueueSnackbar('Error signing up', { variant: 'error' });
        }
    };

    const scrubPhoneNumber = (val) => {
        let phoneChars = "(nnn) nnn-nnnn";
        if (val.length > phoneChars.length || val[0] === '+') {
            phoneChars = "+" + 'n'.repeat(15);
            val = '+' + val.replace(/\D/g, '');
        }
        let pointer = 0;
        let buffer = "";
        for (let i = 0; i < phoneChars.length; i++) {
            let target = phoneChars[i];
            let char = val[pointer];
            if (target === char) {
                buffer += char;
                pointer++;
            } else if (/[0-9]/.test(char)) {
                if (target === 'n') {
                    buffer += char;
                    pointer++;
                } else {
                    buffer += target;
                }
            }
        }
        return buffer
    }

    const handleInputChange = (event) => {
        let val = event.target.value
        if (event.target.name === "phone") {
            val = scrubPhoneNumber(val)
        }
        setFormData({
            ...formData,
            [event.target.name]: val || ''
        });
    };

    const handleDateChange = (date) => {
        fetchUserCount(selectedClassItem, date);
        setFormData({
            ...formData,
            selectedDate: date || ''
        });
    };

    const isThisAClassDay = (d, classItem) => {
        const { startDate, endDate, frequency, days } = classItem;
        const start = new Date(startDate);
        // Date(null) is actually Date(0) whereas Date(undefined) is Invalid Date which works out for us
        const end = new Date(endDate || undefined);
        const current = new Date(d);

        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        current.setHours(0, 0, 0, 0);

        if (current < start || current > end) {
            return false;
        }

        const diffTime = current - start;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        switch (frequency) {
            case 'none':
                return current.getTime() === start.getTime();
            case 'daily':
                return true;
            case 'weekly':
                return days.includes(current.getDay());
            case 'bi-weekly':
                return (diffDays % 14) < 7 && days.includes(current.getDay());
            case 'monthly':
                return start.getDate() === current.getDate();
            default:
                return false;
        }
    };

    useEffect(() => {
        fetchClasses().then(() => {
            setLoading(false);
        });
    }, []);

    return (
        <Container sx={{ marginTop: 4 }}>
            <Typography variant="h1" gutterBottom>{general.Title}</Typography>
            {error && <Typography color="error">Error fetching classes: {error}</Typography>}
            {loading && <CircularProgress />}
            {!loading && classes.length === 0 && <Typography variant="h6" gutterBottom>No classes available</Typography>}
            <Container>
                <Grid container spacing={1}>
                    {classes.map((classItem) => (
                        <Grid item xs={12} sm={6} md={4} key={classItem._id}>
                            <ClassCard 
                                open={classItem === selectedClassItem && open}
                                classItem={classItem} 
                                onOpen={() => {handleOpen(classItem)}}
                                onClose={handleClose}
                                maxModalWidth='1000px'
                            >
                                <form onSubmit={handleSubmit}>
                                    <Grid container spacing={4}>
                                        <Grid item xs={12} md={6} order={(xs && 2) || 1}>
                                            <Typography id="modal-modal-title" variant="h6" component="h2">Select a Date</Typography>
                                            <Calendar
                                                tileDisabled={({ date }) => !isThisAClassDay(date, classItem)}
                                                onChange={handleDateChange}
                                            />
                                            {classFull && <Typography id="modal-modal-title" variant="h6" component="h2">Class full</Typography>}
                                            {numParticipants}/{classItem.size} Participants
                                        </Grid>
                                        <Grid item xs={12} md={6} order={(xs && 1) || 2}>
                                            <Typography id="modal-modal-title" variant="h6" component="h2">Sign Up</Typography>
                                            <TextField
                                                disabled={classFull}
                                                label="Name"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                fullWidth
                                                margin="normal"
                                            />
                                            <TextField
                                                disabled={classFull}
                                                label="Phone Number"
                                                id="phone"
                                                name="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={handleInputChange}
                                                required
                                                fullWidth
                                                margin="normal"
                                                placeholder="(XXX) XXX-XXXX"
                                            />
                                            <TextField
                                                select
                                                disabled={classFull}
                                                label="Insurance"
                                                id="insurance"
                                                name="insurance"
                                                value={formData.insurance}
                                                onChange={handleInputChange}
                                                required
                                                fullWidth
                                                margin="normal"
                                            >
                                                {insurances.map((insurance) => (
                                                    <MenuItem key={insurance} value={insurance}>{insurance}</MenuItem>
                                                ))}
                                                <MenuItem value="Other/None">Other/None</MenuItem>
                                            </TextField>
                                            <input type="hidden" name="selectedDate" value={formData.selectedDate} />
                                            <input type="hidden" name="selectedClass" value={formData.selectedClass} />
                                        </Grid>
                                        <Grid container item xs={12} order={3} justifyContent="center">
                                            <Button type="submit" variant="contained" color="primary" disabled={classFull || formData.selectedDate === ''}>Submit</Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </ClassCard>
                        </Grid>
                    ))}
                </Grid>
            </Container>
            <Snackbar
                open={snackbarState.open}
                autoHideDuration={3000}
                onClose={(event, reason) => {
                    if (reason === 'clickaway') return;
                    setSnackbarState({ ...snackbarState, open: false })
                }}
            >
                <Alert
                    onClose={() => setSnackbarState({ ...snackbarState, open: false })}
                    severity={snackbarState.severity}
                    sx={{ width: '100%' }}
                >
                    {snackbarState.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Landing;
