function tzAgnosticDate(dateString) {
    if (!dateString) {
        return new Date(dateString);
    }

    if (typeof dateString === 'string') {
        if (dateString.endsWith('Z')) {
            dateString = dateString.substring(0, dateString.length-1);
        }
        return new Date(dateString);
    }
    
    return new Date(dateString.getTime() + dateString.getTimezoneOffset() * 60000)
}

export { tzAgnosticDate }