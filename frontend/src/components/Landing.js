import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';


import './Landing.css';
const API_BASE = process.env.REACT_APP_API

const Landing = () => {
    const [classes, setClasses] = useState([]);
    const [error, setError] = useState(null);
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

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
            // If your server runs on port 5000
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


    // Use useEffect to fetch classes when the component mounts
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
                                currentTarget.src = 'data:image/jpeg;base64,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'
                            }}
                        ></img>

                        <Button onClick={handleOpen}>Open modal</Button>
                        <Modal
                            open={open}
                            onClose={handleClose}
                            aria-labelledby="modal-modal-title"
                            aria-describedby="modal-modal-description"
                        >
                            <Box sx={style}>
                                <Typography id="modal-modal-title" variant="h6" component="h2">
                                    Text in a modal
                                </Typography>
                                <Typography id="modal-modal-description" sx={{ mt: 2 }}>
                                    Duis mollis, est non commodo luctus, nisi erat porttitor ligula.
                                </Typography>
                            </Box>
                        </Modal>                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Landing;
