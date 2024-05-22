import React, { useState, useEffect } from 'react';
import { Button, Modal, Box, Typography, TextField, Container, Grid, Card, CardContent, CardMedia, CardActions, CircularProgress, Snackbar, Alert } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useSnackbar } from 'notistack';
import { format, parseISO } from 'date-fns';

const API_BASE = process.env.REACT_APP_API;

const Landing = () => {
    const [classes, setClasses] = useState([]);
    const [error, setError] = useState(null);
    const [open, setOpen] = useState(false);
    const [selectedClassItem, setSelectedClassItem] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        insurance: '',
        selectedDate: '',
        selectedClass: ''
    });
    const [loading, setLoading] = useState(true);
    const [numParticipants, setNumParticipants] = useState(0);

    const [snackbarState, setSnackbarState] = useState({
        open: false,
        message: '',
        severity: 'success'
    })

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
        setFormData({
            name: '',
            phone: '',
            insurance: '',
            selectedDate: '',
            selectedClass: ''
        });
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

    const handleInputChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value || ''
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
        <Container>
            {error && <Typography color="error">Error fetching classes: {error}</Typography>}
            {loading && <CircularProgress />}
            {!loading && classes.length === 0 && <Typography variant="h6" gutterBottom>No classes available</Typography>}
            <Grid container spacing={4}>
                {classes.map((classItem) => (
                    <Grid item xs={12} sm={6} md={4} key={classItem._id}>
                        <Card>
                            <CardMedia
                                component="img"
                                height="140"
                                image={`${API_BASE}/images/${classItem._id}`}
                                alt={classItem.title}
                                onError={({ currentTarget }) => {
                                    currentTarget.onerror = null;
                                }}
                                style={{ objectFit: 'cover' }}
                            />
                            <CardContent>
                                <Typography variant="h5" component="div">{classItem.title}</Typography>
                                <Typography variant="body2" color="text.secondary">Start Date: {format(parseISO(classItem.startDate), "MMMM do, yyyy")}</Typography>
                                {classItem.endDate && <Typography variant="body2" color="text.secondary">End Date: {format(parseISO(classItem.endDate), "MMMM do, yyyy")}</Typography>}
                                <Typography variant="body2" color="text.secondary">
                                    Class Size: {classItem.size}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">{classItem.description}</Typography>
                            </CardContent>
                            <CardActions>
                                <Button variant="contained" onClick={() => handleOpen(classItem)}>
                                    Sign Up
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            {selectedClassItem && (
                <Modal
                    open={open}
                    onClose={handleClose}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Box sx={style}>
                        <Typography id="modal-modal-title" variant="h6" component="h2">Select a Date</Typography>
                        <Calendar
                            tileDisabled={({ date }) => !isThisAClassDay(date, selectedClassItem)}
                            onChange={handleDateChange}
                        />
                        {classFull && <Typography id="modal-modal-title" variant="h6" component="h2">Class full</Typography>}
                        {numParticipants}/{selectedClassItem.size} Participants
                        <form onSubmit={handleSubmit}>
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
                            />
                            <TextField
                                disabled={classFull}
                                label="Insurance"
                                id="insurance"
                                name="insurance"
                                value={formData.insurance}
                                onChange={handleInputChange}
                                required
                                fullWidth
                                margin="normal"
                            />
                            <input type="hidden" name="selectedDate" value={formData.selectedDate} />
                            <input type="hidden" name="selectedClass" value={formData.selectedClass} />
                            <Button type="submit" variant="contained" color="primary" disabled={classFull}>Submit</Button>
                        </form>
                    </Box>
                </Modal>
            )}
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
