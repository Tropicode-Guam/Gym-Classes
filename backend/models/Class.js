const mongoose = require('mongoose');

const sponsors = require('../settings/insurances.json').Sponsors.map(s => s.name || s);

const classSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        default: undefined
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
    },
    days: {
        type: [Number],
        required: false
    },
    frequency: {
        type: String,
        enum: ['none', 'daily', 'weekly', 'bi-weekly', 'monthly'],
        required: true
    },
    color: {
        type: String,
        default: "0"
    },
    sponsor: {
        type: String,
        enum: [...sponsors, null],
        default: null
    },
    trainer: {
        type: String,
        default: null
    }
});

const Class = mongoose.model('Class', classSchema);
module.exports = Class;
