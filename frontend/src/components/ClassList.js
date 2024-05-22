import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Button, Modal, Typography, Box, List, ListItem, ListItemText,
    ListItemSecondaryAction, IconButton, Paper, CircularProgress, MenuItem, Select
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { format, parseISO } from 'date-fns';

const API_BASE = process.env.REACT_APP_API;

function ClassList() {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [users, setUsers] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [classDates, setClassDates] = useState([]);
    const [selectedClassDate, setSelectedClassDate] = useState('');

    const getClasses = async () => {
        try {
            const response = await axios.get(`${API_BASE}/classes`);
            if (response.status === 200) {
                const classData = response.data;

                const classesWithUserCount = await Promise.all(classData.map(async (classItem) => {
                    const userResponse = await axios.get(`${API_BASE}/classes/${classItem._id}/users`);
                    const userCount = userResponse.data.length;
                    return { ...classItem, currentUsers: userCount };
                }));

                return classesWithUserCount;
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
        const selectedClassItem = classes.find((classItem) => classItem._id === classId);
        setSelectedClass(selectedClassItem);
        setShowModal(true);
        const response = await axios.get(`${API_BASE}/classes/${classId}/users`);
        if (response.status === 200) {
            const sortedUsers = response.data.sort((a, b) => new Date(a.selectedDate) - new Date(b.selectedDate));
            setUsers(sortedUsers);

            const uniqueDates = [...new Set(sortedUsers.map(user => user.selectedDate))];
            setClassDates(uniqueDates);
            setSelectedClassDate(uniqueDates[0] || '');
        } else {
            console.error('Failed to fetch users for class:', response.status);
        }
    };

    const handlePrintAttendance = () => {
        const printContent = document.getElementById('printable-attendance').innerHTML;
        const printWindow = window.open('', '', 'width=900,height=650');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Attendance</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            margin: 20px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                        }
                        th, td {
                            border: 1px solid black;
                            padding: 8px;
                            text-align: left;
                        }
                        th {
                            background-color: #f2f2f2;
                        }
                    </style>
                </head>
                <body>
                    ${printContent}
                </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }, 500);
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

    const handleClickDeleteClass = (classId) => {
        setSelectedClass(classes.find((classItem) => classItem._id === classId));
        setShowDeleteModal(true);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const classesData = await getClasses();
                setClasses(classesData);
            } catch (error) {
                console.error('Error fetching classes:', error);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    return (
        <div>
            <Typography variant="h4" gutterBottom>Class List</Typography>
            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    {classes.length > 0 ? (
                        <List>
                            {classes.map((classItem) => (
                                <ListItem key={classItem._id}>
                                    <ListItemText
                                        primary={classItem.title}
                                    />
                                    <ListItemSecondaryAction>
                                        <Button variant="contained" onClick={() => handleViewUsers(classItem._id)}>View Users</Button>
                                        <IconButton onClick={() => handleClickDeleteClass(classItem._id)} aria-label="delete">
                                            <DeleteIcon />
                                        </IconButton>
                                    </ListItemSecondaryAction>
                                </ListItem>
                            ))}
                        </List>
                    ) : (
                        <Typography variant="h6" gutterBottom>No classes available</Typography>
                    )}
                </>
            )}
            <Modal
                open={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
            >
                <Box
                    sx={{
                        display: 'flex', alignItems: 'center',
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
                        <Typography id="modal-title" variant="h6" gutterBottom>Are you sure you want to delete this class?</Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                            <Button
                                onClick={() => {
                                    setShowDeleteModal(false);
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={() => {
                                    handleDeleteClass(selectedClass._id);
                                    setShowDeleteModal(false);
                                }}
                                color="error"
                            >
                                Delete
                            </Button>
                        </Box>
                    </Paper>
                </Box>
            </Modal>
            <Modal
                open={showModal}
                onClose={() => setShowModal(false)}
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
            >
                <Box
                    sx={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100vh',
                        outline: 0,
                    }}
                >
                    <Paper
                        className="no-print"
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
                            <Button onClick={() => setShowModal(false)} variant="outlined" className="no-print">Close</Button>
                        </Box>
                        <Box sx={{ marginBottom: 2 }}>
                            <Typography variant="h6">Select Date</Typography>
                            <Select
                                value={selectedClassDate}
                                onChange={(e) => setSelectedClassDate(e.target.value)}
                                fullWidth
                            >
                                {classDates.map(date => (
                                    <MenuItem key={date} value={date}>
                                        {format(parseISO(date), "MMMM do, yyyy")}
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                        <List id="modal-description">
                            {users.filter(user => user.selectedDate === selectedClassDate).map((user) => (
                                <ListItem key={user._id} divider>
                                    <ListItemText primary={`Name: ${user.name}`} secondary={`Phone: ${user.phone}`} />
                                    <ListItemText primary={`Insurance: ${user.insurance}`} secondary={`Selected Date: ${format(parseISO(user.selectedDate), "MMMM do, yyyy")}`} />
                                </ListItem>
                            ))}
                        </List>
                        <Box sx={{ marginTop: 2 }}>
                            <Button variant="contained" color="primary" onClick={handlePrintAttendance} className="no-print">
                                Print Attendance
                            </Button>
                        </Box>
                    </Paper>
                    <div id="printable-attendance" style={{ display: 'none' }}>
                        <h2>Attendance for {selectedClass?.title} on {selectedClassDate && format(parseISO(selectedClassDate), "MMMM do, yyyy")}</h2>
                        <table>
                            <thead>
                                <tr>
                                    <th></th>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Insurance</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.filter(user => user.selectedDate === selectedClassDate).map((user) => (
                                    <tr key={user._id}>
                                        <td></td>
                                        <td>{user.name}</td>
                                        <td>{user.phone}</td>
                                        <td>{user.insurance}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Box>
            </Modal>
            <style>
                {`
                    @media print {
                        .no-print {
                            display: none;
                        }
                        .MuiPaper-root {
                            box-shadow: none !important;
                        }
                    }
                `}
            </style>
        </div>
    );
}

export default ClassList;
