const mongoose = require('mongoose');

const insurances = require('../settings/insurances.json').Insurances;


const signUpSchema = new mongoose.Schema({
    // 
    selectedClass: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    insurance: {
        type: String,
        required: true,
        enum: [...insurances, 'Other/None']
    },
    gymMembership: {
        type: String,
        required: false
    },
    selectedDate: {
        type: Date,
        required: true
    }
});

const SignUp = mongoose.model('SignUp', signUpSchema);
module.exports = SignUp;
