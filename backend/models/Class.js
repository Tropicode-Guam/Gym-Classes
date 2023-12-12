const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    image: {
        type: Buffer,
        required: false
    },
    imageType: {
        type: String,
        required: false
    }
});

const Class = mongoose.model('Class', classSchema);
module.exports = Class;
