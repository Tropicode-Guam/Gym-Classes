import { Card, CardContent, CardMedia, Dialog, DialogContent, DialogContentText, IconButton, Typography } from "@mui/material";
import { format, parseISO } from 'date-fns';
import { useTheme, ThemeProvider, alpha } from '@mui/material/styles';
import React from 'react';
import { useState, useEffect } from 'react';
import { SUB_THEMES } from "../theme";
import CloseIcon from '@mui/icons-material/Close';
import { DialogActions } from '@mui/material';
import { styled } from '@mui/system';

const API_BASE = process.env.REACT_APP_API;

const CustomDialogPaper = styled('div')(({ theme }) => ({
    margin: '0', // Default margin
  
    // Media query for small screens
    [theme.breakpoints.down('sm')]: {
        margin: '0', // Remove margin for mobile view
        width: '100vw', // Full viewport width
        maxWidth: '100vw', // Ensure no max width limitation
        maxHeight: '100%', // Ensure no max height limitation
    },
}));

export function ClassCard(props) {
    const { classItem, children, onOpen, onClose, maxModalWidth, open } = props;
    const theme = useTheme();
    const cardTheme = theme.palette[classItem.color];
    const [isOpen, setIsOpen] = useState(false);

    let freqDisp = "";
    switch (classItem.frequency) {
        case "none":
            freqDisp = classItem.startDate && format(parseISO(classItem.startDate), 'MMMM do');
            break;
        case "weekly":
            const daysOrder = [0,1,2,3,4,5,6];
            const daysLetters = "SMTWTFS"
            const days = {}
            daysOrder.forEach((i) => {
                days[i] = classItem.days.includes(i)
            })
            freqDisp = (
                <Typography display="inline">
                    ({daysOrder.map(i => {
                        return (<Typography display="inline"
                            sx={{
                                color: days[i] ? 'inherit' : theme.palette.grey[500],
                                fontWeight: days[i] ? 'bold' : 'normal'
                            }}
                        >{daysLetters[i]}</Typography>)
                    })})
                </Typography>
            )
            break;
        case "bi-weekly":
            freqDisp = "Every other week";
            break;
        default:
            freqDisp = classItem.frequency[0].toUpperCase() + classItem.frequency.slice(1);
            break;
    }

    const close = function() {
        onClose && onClose();
        setIsOpen(false);
    }

    useEffect(() => {
        if (open !== isOpen) {
            setIsOpen(open);
        }
    }, [open]);

    return (
        <>
            <ThemeProvider theme={SUB_THEMES[classItem.color]}>
                <Card
                    sx={{
                        color: cardTheme.contrastText,
                        backgroundColor: cardTheme.main,
                        borderRadius: 10
                    }}
                    onClick={() => {onOpen && onOpen(); typeof open === "undefined" && setIsOpen(true)}}
                >
                    <CardMedia
                        component="img"
                        height="250"
                        image={classItem.imageUrl || `${API_BASE}/images/${classItem._id}`}
                        alt={classItem.title}
                        onError={({ currentTarget }) => {
                            currentTarget.onerror = null;
                        }}
                        style={{ objectFit: 'cover' }}
                    />
                    <CardContent>
                        <Typography variant="h5" component="div">
                            {classItem.title || 'TITLE'} | <Typography variant="body1" display={"inline"}>
                                {freqDisp}
                            </Typography>
                        </Typography>
                        {classItem.sponsor && <Typography variant="body1">Sponsored By {classItem.sponsor}</Typography>}
                        <Typography variant="body2"
                            sx={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                display: "-webkit-box",
                                WebkitLineClamp: "2",
                                WebkitBoxOrient: "vertical",
                            }}
                        >
                            {classItem.description || 'DESCRIPTION'}
                        </Typography>
                    </CardContent>
                </Card>
            </ThemeProvider>
            <Dialog
                open={isOpen}
                onClose={close}
                PaperProps={{
                    sx: maxModalWidth && {
                        maxWidth: maxModalWidth
                    } ,
                    component: CustomDialogPaper
                }}
                fullWidth
                maxWidth={false}
                sx={{
                    maxWidth: "100%",
                    maxHeight: "100%"
                }}
            >
                {/* using cardmedia in here just to get the same centered cropping */}
                <CardMedia
                    component="img"
                    height="250"
                    image={classItem.imageUrl || `${API_BASE}/images/${classItem._id}`}
                    alt={classItem.title}
                    onError={({ currentTarget }) => {
                        currentTarget.onerror = null;
                    }}
                    style={{ objectFit: 'cover' }}
                />
                <IconButton
                    aria-label="close"
                    onClick={close}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                        backgroundColor: (theme) => alpha(theme.palette.grey[100], .75),
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent>
                    {/* <Box sx={{
                        display: 'flex', 
                        flexDirection: 'row', 
                        justifyContent: 'space-between'
                    }}> */}
                        <Typography variant="h5" display="inline">{classItem.title} | </Typography>
                        <Typography variant="body1" display="inline">{freqDisp} from {
                            classItem.startDate ? format(parseISO(classItem.startDate), 'h:mmaaa') : "0:00am"
                        } - {
                            classItem.endTime   ? format(parseISO(classItem.endTime),   'h:mmaaa') : "0:00am"
                        }</Typography>
                    {/* </Box> */}
                    {classItem.sponsor && <Typography variant="body1">Sponsored By {classItem.sponsor}</Typography>}
                    {classItem.trainer && <Typography variant="body1">Hosted by {classItem.trainer}</Typography>}
                    <DialogContentText>{classItem.description}</DialogContentText>
                    <DialogActions sx={{ paddingLeft: 0, paddingRight: 0, paddingTop: 4}}>
                        { children }
                    </DialogActions>
                </DialogContent>
            </Dialog>
        </>
    )
}