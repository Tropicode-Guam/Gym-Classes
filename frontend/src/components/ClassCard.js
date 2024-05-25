import { Card, CardActions, CardContent, CardMedia, Typography } from "@mui/material";
import { format, parseISO } from 'date-fns';
import { useTheme, ThemeProvider } from '@mui/material/styles';
import React, { useContext } from 'react';
import { SubThemeContext } from "../App";

const API_BASE = process.env.REACT_APP_API;

export function ClassCard(props) {
    const { classItem, children } = props;
    const theme = useTheme();
    const { subThemes } = useContext(SubThemeContext);
    const cardTheme = theme.palette[classItem.color];

    console.log(subThemes)

    return (
        <ThemeProvider theme={subThemes[classItem.color]}>
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
                    image={`${API_BASE}/images/${classItem._id}`}
                    alt={classItem.title}
                    onError={({ currentTarget }) => {
                        currentTarget.onerror = null;
                    }}
                    style={{ objectFit: 'cover' }}
                />
                <CardContent>
                    <Typography variant="h5" component="div">{classItem.title}</Typography>
                    <Typography variant="body2">Start Date: {format(parseISO(classItem.startDate), "MMMM do, yyyy")}</Typography>
                    {classItem.endDate && <Typography variant="body2">End Date: {format(parseISO(classItem.endDate), "MMMM do, yyyy")}</Typography>}
                    <Typography variant="body2">
                        Class Size: {classItem.size}
                    </Typography>
                    <Typography variant="body2">{classItem.description}</Typography>
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