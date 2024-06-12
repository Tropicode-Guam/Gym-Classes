import React, { useState, useContext } from 'react';
import { Button, Typography, TextField, Container, Grid, CircularProgress, Snackbar, Alert, MenuItem, Checkbox, FormControlLabel, Dialog, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { format } from 'date-fns';
import { ClassCard } from './ClassCard';
import insurances from 'settings/insurances';
import general from 'settings/general';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Collapse from '@mui/material/Collapse';
import { OnlyOngoingContext } from '../Contexts';
import { useGetClassesQuery } from '../slices/classesSlice';

const memberIDLabel = "Insurance Member ID"
const INSURANCE_MAP = {}
const SPONSORS_MAP = {}
insurances.Sponsors.forEach(s => {
    if (s.name) {
        SPONSORS_MAP[s.name] = s
    } else {
        SPONSORS_MAP[s] = {name: s}
    }    
})
insurances = insurances.Insurances.map(s => s.name && s || {name: s, id_name: memberIDLabel})
insurances.forEach(({name, id_name}) => {
    INSURANCE_MAP[name] = {
        id_name,
        also_free_for: SPONSORS_MAP[name] && SPONSORS_MAP[name].also_free_for
    }
})

const API_BASE = process.env.REACT_APP_API;
const FEE_MSG = general['Fee Message']

const Landing = () => {
    const onlyOngoing = useContext(OnlyOngoingContext);
    const { data: classes, isLoading: loading, error } = useGetClassesQuery(onlyOngoing);
    const [open, setOpen] = useState(false);
    const [selectedClassItem, setSelectedClassItem] = useState(null);
    const emptyFormData = {
        name: '',
        phone: '',
        gymMembership: '',
        insurance: '',
        insuranceMemberId: '',
        selectedDate: '',
        selectedClass: ''
    }
    const [formData, setFormData] = useState({...emptyFormData});
    const [hasGymMembership, setHasGymMembership] = useState(false);
    const [numParticipants, setNumParticipants] = useState(0);

    const [snackbarState, setSnackbarState] = useState({
        open: false,
        message: '',
        severity: 'success'
    })

    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

    const theme = useTheme();
    const xs = useMediaQuery(theme.breakpoints.up('md'));

    const resetFormData = () => {
        setHasGymMembership(false);
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
        setConfirmDialogOpen(false);
        resetFormData()
    };

    const fetchUserCount = async (classItem, date) => {
        date = format(date, 'yyyy-MM-dd');
        const userResponse = await fetch(`${API_BASE}/classes/${classItem._id}/users/date/${date}`);
        const users = await userResponse.json();
        setNumParticipants(users.length);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (selectedClassItem.currentUsers >= selectedClassItem.size) {
            enqueueSnackbar('Class is full!', { variant: 'error' });
            return;
        }

        if (!formData.selectedDate) {
            enqueueSnackbar('Please select a date', { variant: 'error' });
            return;
        }

        if (hasGymMembership && !formData.gymMembership) {
            enqueueSnackbar('Please enter your gym membership number', { variant: 'error' });
            return
        }

        if (formData.insurance !== 'Other/None' && !formData.insuranceMemberId) {
            enqueueSnackbar('Please enter your insurance member id', { variant: 'error' });
            return
        }

        const freeForAll = INSURANCE_MAP[formData.insurance] && INSURANCE_MAP[formData.insurance].also_free_for === "all"
        const freeFor = SPONSORS_MAP[selectedClassItem.sponsor] && SPONSORS_MAP[selectedClassItem.sponsor].also_free_for

        if (!Number(selectedClassItem.fee) ||
            selectedClassItem.sponsor === formData.insurance ||
            hasGymMembership ||
            freeForAll ||
            freeFor === formData.insurance ||
            (Array.isArray(freeFor) && freeFor.includes(formData.insurance))
        ) {
            await createNewSignup()
        } else {
            setConfirmDialogOpen(true)
        }
    };

    const createNewSignup = async () => {
        try {
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
        const newFormData = { ...formData }
        if (event.target.name === "insurance" && val === 'Other/None') {
            newFormData.insuranceMemberId = ''
        }
        setFormData({
            ...newFormData,
            [event.target.name]: val || ''
        });
    };

    const handleDateChange = (date) => {
        if (!withinDaysBeforeClass(selectedClassItem, date)) {
            enqueueSnackbar(`You can only sign up ${selectedClassItem.daysPriorCanSignUp} days in advance for this class`, { variant: 'error' })
            return
        }
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

    const withinDaysBeforeClass = (classItem, date) => {
        if (!classItem.daysPriorCanSignUp) {
            return true
        }
        const today = new Date()
        today.setHours(0,0,0,0)
        const current = new Date(date)
        const diff = current - today
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        return days <= classItem.daysPriorCanSignUp
    }

    return (
        <Container sx={{ marginTop: 4 }}>
            <Typography variant="h1" gutterBottom>{general.Title}</Typography>
            {error && <Typography color="error">Error fetching classes: {error.error}</Typography>}
            {loading && <CircularProgress />}
            {!loading && classes && classes.length === 0 && <Typography variant="h6" gutterBottom>No classes available</Typography>}
            <Container>
                <Grid container spacing={1}>
                    {classes && classes.map((classItem) => (
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
                                                value={formData.selectedDate}
                                                calendarType='gregory'
                                                tileDisabled={({ date }) => !isThisAClassDay(date, classItem)}
                                                onChange={handleDateChange}
                                                minDetail="month"
                                                formatDay={(locale, date) => {
                                                    const s = format(date, 'd');
                                                    if (classItem.daysPriorCanSignUp) {
                                                        const today = new Date()
                                                        today.setHours(0,0,0,0)
                                                        const current = new Date(date)

                                                        if (withinDaysBeforeClass(classItem, date) && current >= today) {
                                                            return <Typography variant="body2" sx={{fontWeight: 'bold', color: 'green'}}>{s}</Typography>
                                                        } else {
                                                            return <Typography variant="body2" sx={{color: theme.palette.grey[500]}}>{s}</Typography>
                                                        }
                                                    } else {
                                                        return <Typography variant="body2" sx={{fontWeight: 'bold', color: theme.palette.grey[500]}}>{s}</Typography>
                                                    }
                                                }}
                                            />
                                            {classItem.daysPriorCanSignUp !== 0 && <Typography variant="body1" sx={{color: 'green'}}>You can only sign up {classItem.daysPriorCanSignUp} days before the class</Typography>}
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
                                            <FormControlLabel control={
                                                <Checkbox 
                                                    disabled={classFull}
                                                    checked={hasGymMembership} 
                                                    onChange={(e) => {
                                                        const val = e.target.checked
                                                        setHasGymMembership(val);
                                                        if (!val) {
                                                            setFormData({...formData, gymMembership: ''})
                                                        }
                                                    }
                                                } />
                                            } label="I have a gym membership" />
                                            <Collapse in={hasGymMembership}>
                                                <TextField
                                                    disabled={classFull}
                                                    label="Gym Membership Number"
                                                    id="gymMembership"
                                                    name="gymMembership"
                                                    value={formData.gymMembership}
                                                    onChange={handleInputChange}
                                                    required={hasGymMembership}
                                                    fullWidth
                                                    margin="normal"
                                                />
                                            </Collapse>
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
                                                {insurances.map(({name: insurance}) => (
                                                    <MenuItem key={insurance} value={insurance}>{insurance}</MenuItem>
                                                ))}
                                                <MenuItem value="Other/None">Other/None</MenuItem>
                                            </TextField>
                                            <Collapse in={Boolean(formData.insurance) && formData.insurance !== "Other/None"}>
                                                <TextField
                                                    disabled={classFull}
                                                    label={INSURANCE_MAP[formData.insurance] && INSURANCE_MAP[formData.insurance].id_name}
                                                    id="insuranceMemberId"
                                                    name="insuranceMemberId"
                                                    value={formData.insuranceMemberId}
                                                    onChange={handleInputChange}
                                                    required={Boolean(formData.insurance) && formData.insurance !== "Other/None"}
                                                    fullWidth
                                                    margin="normal"
                                                />
                                            </Collapse>
                                            <input type="hidden" name="selectedDate" value={formData.selectedDate} />
                                            <input type="hidden" name="selectedClass" value={formData.selectedClass} />
                                        </Grid>
                                        <Grid container item xs={12} order={3} justifyContent="center">
                                            <Button type="submit" variant="contained" color="primary" disabled={classFull}>Submit</Button>
                                        </Grid>
                                    </Grid>
                                </form>
                            </ClassCard>
                        </Grid>
                    ))}
                </Grid>
            </Container>
            <Dialog
                open={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
            >
                <DialogContent>
                    <DialogContentText>
                        {FEE_MSG.replace('{FEE}', selectedClassItem && selectedClassItem.fee)}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
                    <Button onClick={() => createNewSignup()}>Agree</Button>
                </DialogActions>
            </Dialog>
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
