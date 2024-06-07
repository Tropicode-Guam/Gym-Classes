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
    endTime: {
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
    daysPriorCanSignUp: {
        type: Number,
        default: 2,
        validate: {
            validator: function(v) {
                return  Number.isInteger(v) && v >= 0;
            },
            message: props => `${props.path} needs to be an integer 0 or greater. ${props.value} was given`
        }
    },
    color: {
        type: String,
        default: "0"
    },
    fee: {
        type: Number,
        default: 0,
        get: (n) => {
            return (n/100).toFixed(2);
        },
        set: (n) => {
            return n*100;
        }
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
}, {
    toJSON: {
        getters: true,
        setters: true
    },
    toObject: {
        getters: true,
        setters: true
    },
    timestamps: true
});

const Class = mongoose.model('Class', classSchema);
module.exports = Class;
