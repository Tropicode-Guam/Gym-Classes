import React, { useState, useEffect } from 'react';
import { Button, Modal, Box, Typography, TextField, Container, Grid, Card, CardContent, CardMedia, CardActions } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

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
        selectedDate: null,
        selectedClass: null
    });

    const handleOpen = (classItem) => {
        setSelectedClassItem(classItem);
        setFormData({
            ...formData,
            selectedClass: classItem._id
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
            selectedDate: null,
            selectedClass: null
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
            const data = await response.json();
            setClasses(data);
        } catch (error) {
            setError(`Error fetching classes: ${error.message}`);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await fetch(`${API_BASE}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            if (!response.ok) {
                throw new Error('Failed to sign up');
            }
            console.log('User signed up successfully!');
        } catch (error) {
            console.error('Error signing up:', error.message);
        }
    };

    const handleInputChange = (event) => {
        setFormData({
            ...formData,
            [event.target.name]: event.target.value
        });
    };

    const handleDateChange = (date) => {
        setFormData({
            ...formData,
            selectedDate: date
        });
    };

    const isThisAClassDay = (d, classItem) => {
        const { date, frequency, days } = classItem;
        const start = new Date(date);
        const current = new Date(d);

        if (current < start) {
            return false;
        }

        const diffTime = Math.abs(current - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (frequency) {
            case 'none':
                return false;
            case 'daily':
                return true;
            case 'weekly':
                return days.includes(current.getDay());
            case 'bi-weekly':
                return diffDays % 14 < 7 && days.includes(current.getDay());
            case 'monthly':
                return start.getDate() === current.getDate();
            default:
                return false;
        }
    }

    useEffect(() => {
        fetchClasses();
    }, []);

    return (
        <Container>
            <Typography variant="h2" gutterBottom>Classes</Typography>
            {error && <Typography color="error">Error fetching classes: {error}</Typography>}
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
                                <Typography variant="body2" color="text.secondary">Date: {classItem.date}</Typography>
                                <Typography variant="body2" color="text.secondary">{classItem.description}</Typography>
                            </CardContent>
                            <CardActions>
                                <Button variant="contained" onClick={() => handleOpen(classItem)}>Open modal</Button>
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
                        <form onSubmit={handleSubmit}>
                            <TextField
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
                            <Button type="submit" variant="contained" color="primary">Submit</Button>
                        </form>
                    </Box>
                </Modal>
            )}
        </Container>
    );
};

export default Landing;
