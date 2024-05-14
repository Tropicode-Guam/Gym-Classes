import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Button, Modal, Typography, Box, List, ListItem, ListItemText,
    ListItemSecondaryAction, IconButton, Paper
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const API_BASE = process.env.REACT_APP_API;

function ClassList() {
    const [classes, setClasses] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);

    const getClasses = async () => {
        try {
            const response = await axios.get(`${API_BASE}/classes`);
            if (response.status === 200) {
                return response.data;
            } else {
                console.error('Error fetching classes:', response.status);
                return [];
            }
        } catch (error) {
            console.error('Error fetching classes:', error);
            return [];
        }
    };

    const handleViewUsers = async (classId) => {
        setSelectedClass(classes.find((classItem) => classItem._id === classId));
        setShowModal(true);
        try {
            const response = await fetch(`${API_BASE}/classes/${classId}/users`);
            if (!response.ok) {
                throw new Error('Failed to fetch users for class');
            }
            setUsers(await response.json());
        } catch (error) {
            console.error('Error fetching users for class:', error);
        }
    };

    const handleDeleteClass = async (classId) => {
        try {
            const response = await axios.delete(`${API_BASE}/classes/${classId}`);
            if (response.status === 200) {
                const updatedClasses = await getClasses();
                setClasses(updatedClasses);
            } else {
                console.error('Error deleting class:', response.status);
            }
        } catch (error) {
            console.error('Error deleting class:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const classesData = await getClasses();
                setClasses(classesData);
            } catch (error) {
                console.error('Error fetching classes:', error);
            }
        };
        fetchData();
    }, []);

    return (
        <div>
            <Typography variant="h4" gutterBottom>Class List</Typography>
            <List>
                {classes.map((classItem) => (
                    <ListItem key={classItem._id}>
                        <ListItemText primary={classItem.title} secondary={`Description: ${classItem.description}`} />
                        <ListItemSecondaryAction>
                            <Button variant="contained" onClick={() => handleViewUsers(classItem._id)}>View Users</Button>
                            <IconButton onClick={() => handleDeleteClass(classItem._id)} aria-label="delete">
                                <DeleteIcon />
                            </IconButton>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
            </List>
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        outline: 0,
                    }}
                >
                    <Paper
                        sx={{
                            padding: 4,
                            width: '80%',
                            maxWidth: '600px',
                            bgcolor: 'background.paper',
                            boxShadow: 24,
                            opacity: 1,
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography id="modal-title" variant="h5" gutterBottom>Users for {selectedClass && selectedClass.title}</Typography>
                            <Button onClick={() => setShowModal(false)} variant="outlined">Close</Button>
                        </Box>
                        <List id="modal-description">
                            {users.map((user) => (
                                <ListItem key={user._id} divider>
                                    <ListItemText primary={`Name: ${user.name}`} secondary={`Phone: ${user.phone}`} />
                                    <ListItemText primary={`Insurance: ${user.insurance}`} secondary={`Selected Date: ${user.selectedDate}`} />
                                </ListItem>
                            ))}
                        </List>
                    </Paper>
                </Box>
            </Modal>
        </div>
    );
}

export default ClassList;
