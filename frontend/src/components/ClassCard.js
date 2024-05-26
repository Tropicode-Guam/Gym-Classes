import { Card, CardActions, CardContent, CardMedia, Typography } from "@mui/material";
import { format, parseISO } from 'date-fns';
import { useTheme, ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { SUB_THEMES } from "../theme";

const API_BASE = process.env.REACT_APP_API;

export function ClassCard(props) {
    const { classItem, children } = props;
    const theme = useTheme();
    const cardTheme = theme.palette[classItem.color];

    return (
        <ThemeProvider theme={SUB_THEMES[classItem.color]}>
            <Card
                sx={{
                    color: cardTheme.contrastText,
                    backgroundColor: cardTheme.main,
                    borderRadius: 3
                }}
            >
                <CardMedia
                    component="img"
                    height="140"
                    image={classItem.imageUrl || `${API_BASE}/images/${classItem._id}`}
                    alt={classItem.title}
                    onError={({ currentTarget }) => {
                        currentTarget.onerror = null;
                    }}
                    style={{ objectFit: 'cover' }}
                />
                <CardContent>
                    <Typography variant="h5" component="div">{classItem.title || 'TITLE'}</Typography>
                    <Typography variant="body2">Start Date: {classItem.startDate && format(parseISO(classItem.startDate), "MMMM do, yyyy") || 'DATE'}</Typography>
                    {classItem.endDate && <Typography variant="body2">End Date: {format(parseISO(classItem.endDate), "MMMM do, yyyy")}</Typography>}
                    <Typography variant="body2">
                        Class Size: {classItem.size || '#'}
                    </Typography>
                    <Typography variant="body2">{classItem.description || 'DESCRIPTION'}</Typography>
                </CardContent>
                <CardActions>
                    {children}
                </CardActions>
            </Card>
        </ThemeProvider>
    )
}

export function ClassCardAction({ children }) {
    return (
        <div>
            {children}
        </div>
    )
}