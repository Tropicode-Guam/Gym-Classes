import { Card, CardActions, CardContent, CardMedia, Typography } from "@mui/material";
import { format, parseISO } from 'date-fns';
import { useTheme, ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { SUB_THEMES } from "../theme";

const API_BASE = process.env.REACT_APP_API;

export function ClassCard(props) {
    const { classItem, children, onClick } = props;
    const theme = useTheme();
    const cardTheme = theme.palette[classItem.color];

    return (
        <ThemeProvider theme={SUB_THEMES[classItem.color]}>
            <Card
                sx={{
                    color: cardTheme.contrastText,
                    backgroundColor: cardTheme.main,
                    borderRadius: 10
                }}
                onClick={onClick}
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
                        {classItem.title || 'TITLE'} | <Typography variant="body2" display={"inline"}>
                            {`${classItem.startDate ? format(parseISO(classItem.startDate), 'MMMM do') : 'DATE'} ${classItem.endDate ? ` - ${format(parseISO(classItem.endDate), 'MMMM do')}` : ''}`}
                        </Typography>
                    </Typography>
                    <Typography variant="body2">
                        {classItem.description || 'DESCRIPTION'}
                    </Typography>
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