import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
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
        selectedClass: null // Add selectedClass field
    });

    const handleOpen = (classItem) => {
        setSelectedClassItem(classItem);
        setFormData({
            ...formData,
            selectedClass: classItem._id // Set only the ID of the selected class
        });
        setOpen(true);
    };
    

    const handleClose = () => {
        setOpen(false);
        setSelectedClassItem(null);
        setFormData({ // Reset formData when closing the modal
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
        
        console.log("formdata", formData);

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

    function isThisAClassDay(d, classItem) {
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
                if (days.includes(current.getDay())) {
                    return true;
                }
                return false;
            case 'bi-weekly':
                if (diffDays % 14 < 7 && days.includes(current.getDay())) {
                    return true;
                }
                return false;
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
        <div className='Classes'>
            <h1>Classes</h1>
            {error && <p>Error fetching classes: {error}</p>}
            <ul>
                {classes.map((classItem) => (
                    <li key={classItem._id}>
                        <h2>{classItem.title}</h2>
                        <p>Date: {classItem.date}</p>
                        <p>Description: {classItem.description}</p>
                        <img
                            src={`${API_BASE}/images/${classItem._id}`}
                            onError={({ currentTarget }) => {
                                currentTarget.onerror = null;
                            }}
                            alt={classItem.title}
                        ></img>
                        <Button onClick={() => handleOpen(classItem)}>Open modal</Button>
                    </li>
                ))}
                {selectedClassItem && (
                    <Modal
                        open={open}
                        onClose={handleClose}
                        aria-labelledby="modal-modal-title"
                        aria-describedby="modal-modal-description"
                    >
                        <Box sx={style}>
                            <Typography id="modal-modal-title" variant="h6" component="h2">
                                Select a Date
                            </Typography>
                            <Calendar
                                tileDisabled={({ date }) => !isThisAClassDay(date, selectedClassItem)}
                                onChange={handleDateChange}
                            />
                            <form onSubmit={handleSubmit}>
                                <label htmlFor="name">Name:</label>
                                <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                                <label htmlFor="phone">Phone Number:</label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} required />
                                <label htmlFor="insurance">Insurance:</label>
                                <input type="text" id="insurance" name="insurance" value={formData.insurance} onChange={handleInputChange} required />
                                <input type="hidden" name="selectedDate" value={formData.selectedDate} />
                                <input type="hidden" name="selectedClass" value={formData.selectedClass} />
                                <Button type="submit">Submit</Button>
                            </form>
                        </Box>
                    </Modal>
                )}
            </ul>
        </div>
    );
};

export default Landing;
